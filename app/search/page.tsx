'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Search, User, Users, FileText, Shield, Loader2,
  Trophy, UserCheck, Building2, MessageSquare, X,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { NewsListItem } from '@/components/news/NewsCardList'

type SearchType = 'all' | 'players' | 'teams' | 'posts' | 'users' | 'competitions' | 'agents' | 'agencies' | 'forums'

interface PlayerResult { id: string; name: string; position?: string | null; nationality?: string | null; photoUrl?: string | null; currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null }
interface TeamResult { id: string; name: string; country?: string | null; badgeUrl?: string | null }
interface PostResult { id: string; content: string; createdAt: string; author: { id: string; name: string; handle: string; avatar: string } }
interface UserResult { id: string; name: string; handle: string; avatar: string; bio?: string | null }
interface CompetitionResult { id: string; name: string; country?: string | null; logoUrl?: string | null }
interface AgentResult { id: string; name: string; nationality?: string | null }
interface AgencyResult { id: string; name: string; country?: string | null }
interface ThreadResult { id: string; title: string; createdAt: string; author: { name: string; handle: string }; category: { slug: string; name: string } }

interface SearchResults {
  players: PlayerResult[]
  teams: TeamResult[]
  posts: PostResult[]
  users: UserResult[]
  competitions: CompetitionResult[]
  agents: AgentResult[]
  agencies: AgencyResult[]
  threads: ThreadResult[]
}

interface Suggestion {
  type: 'player' | 'team' | 'competition' | 'agent' | 'agency' | 'user'
  id: string
  label: string
  sublabel: string
  href: string
  badgeUrl: string | null
}

const TABS: { key: SearchType; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Search },
  { key: 'players', label: 'Players', icon: User },
  { key: 'teams', label: 'Teams', icon: Shield },
  { key: 'competitions', label: 'Competitions', icon: Trophy },
  { key: 'users', label: 'People', icon: Users },
  { key: 'agents', label: 'Agents', icon: UserCheck },
  { key: 'agencies', label: 'Agencies', icon: Building2 },
  { key: 'forums', label: 'Forums', icon: MessageSquare },
  { key: 'posts', label: 'Posts', icon: FileText },
]

const SUGGESTED_QUERIES = [
  { label: 'Haaland', query: 'Haaland', type: 'players' as SearchType },
  { label: 'Premier League', query: 'Premier League', type: 'competitions' as SearchType },
  { label: 'Barcelona', query: 'Barcelona', type: 'teams' as SearchType },
  { label: 'Mbappé', query: 'Mbappe', type: 'players' as SearchType },
  { label: 'Transfer rumours', query: 'transfer', type: 'posts' as SearchType },
  { label: 'Real Madrid', query: 'Real Madrid', type: 'teams' as SearchType },
]

const TYPE_ICONS: Record<Suggestion['type'], string> = {
  player: '👤', team: '🛡️', competition: '🏆', agent: '🤝', agency: '🏢', user: '👥',
}

function SuggestionDropdown({ suggestions, query, onSelect, onClose }: {
  suggestions: Suggestion[]
  query: string
  onSelect: (s: Suggestion) => void
  onClose: () => void
}) {
  if (!suggestions.length && query.length < 1) return null
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
      {suggestions.length === 0 && (
        <p className="px-4 py-3 text-sm text-muted-foreground">No suggestions yet…</p>
      )}
      {suggestions.map((s) => (
        <Link
          key={`${s.type}-${s.id}`}
          href={s.href}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm overflow-hidden">
            {s.badgeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.badgeUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span>{TYPE_ICONS[s.type]}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.label}</p>
            <p className="truncate text-xs text-muted-foreground">{s.sublabel}</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
            {s.type}
          </span>
        </Link>
      ))}
      {query.length >= 2 && (
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center gap-2 border-t px-3 py-2.5 text-sm text-green-600 hover:bg-muted transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          See all results for &ldquo;{query}&rdquo;
        </button>
      )}
    </div>
  )
}

function SearchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const initialType = (searchParams.get('type') as SearchType) ?? 'all'

  const [query, setQuery] = useState(initialQ)
  const [activeType, setActiveType] = useState<SearchType>(initialType)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [latestNews, setLatestNews] = useState<NewsListItem[] | null>(null)
  const [trendingNews, setTrendingNews] = useState<NewsListItem[] | null>(null)
  const [newsLoading, setNewsLoading] = useState(false)

  const doSearch = useCallback(async (q: string, type: SearchType) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      const data = await res.json() as SearchResults
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const doSuggest = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); return }
    setSuggestionsLoading(true)
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`)
      const data = await res.json() as Suggestion[]
      setSuggestions(data)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  // Main search debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, activeType)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (activeType !== 'all') params.set('type', activeType)
      router.replace(`/search${params.size ? '?' + params.toString() : ''}`, { scroll: false })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, activeType, doSearch, router])

  // Suggestions debounce — faster
  useEffect(() => {
    clearTimeout(suggestDebounceRef.current)
    if (!showSuggestions) return
    suggestDebounceRef.current = setTimeout(() => {
      void doSuggest(query)
    }, 150)
    return () => clearTimeout(suggestDebounceRef.current)
  }, [query, showSuggestions, doSuggest])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // News
  useEffect(() => {
    let cancelled = false
    async function loadNews() {
      try {
        setNewsLoading(true)
        const [latestRes, transfersRes] = await Promise.all([fetch('/api/news?scope=latest'), fetch('/api/news?scope=transfers')])
        const latestJson = (await latestRes.json()) as { items?: NewsListItem[] }
        const transfersJson = (await transfersRes.json()) as { items?: NewsListItem[] }
        if (!cancelled) { setLatestNews(latestJson.items ?? []); setTrendingNews(transfersJson.items ?? []) }
      } catch {
        if (!cancelled) { setLatestNews([]); setTrendingNews([]) }
      } finally {
        if (!cancelled) setNewsLoading(false)
      }
    }
    void loadNews()
    return () => { cancelled = true }
  }, [])

  const totalResults = results
    ? results.players.length + results.teams.length + results.posts.length + results.users.length + results.competitions.length + results.agents.length + results.agencies.length + results.threads.length
    : 0

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 pt-4 pb-0 sm:px-6">
          <h1 className="text-xl font-bold mb-3">Search</h1>
          <div ref={containerRef} className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search players, clubs, competitions, agents…"
              className="pl-9 pr-9"
            />
            {(loading || suggestionsLoading) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {query && !loading && !suggestionsLoading && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults(null); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggestions && (query.length >= 1) && (
              <SuggestionDropdown
                suggestions={suggestions}
                query={query}
                onSelect={() => setShowSuggestions(false)}
                onClose={() => setShowSuggestions(false)}
              />
            )}
          </div>

          {/* Tabs */}
          <div className="flex -mb-px gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveType(key); setShowSuggestions(false) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeType === key
                    ? 'border-green-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-6" onClick={() => setShowSuggestions(false)}>
          {!query && (
            <div className="space-y-8 pt-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Search players, clubs, competitions, agents and more</p>
              </div>

              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Suggested searches</h2>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => { setActiveType(s.type); setQuery(s.query) }}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Latest headlines</h2>
                    <Link href="/news" className="text-[11px] text-green-600 hover:underline">Open news hub</Link>
                  </div>
                  {newsLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
                  <ul className="space-y-2">
                    {latestNews?.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <Link href={item.url ?? '/news'} className="block rounded-lg border border-border/60 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors">
                          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.source} · {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trending transfers</h2>
                  <ul className="space-y-2">
                    {trendingNews?.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <Link href={item.url ?? '/news?scope=transfers'} className="block rounded-lg border border-border/60 bg-muted/10 px-3 py-2 hover:bg-muted/30 transition-colors">
                          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.source} · {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}

          {query && query.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-8">Type at least 2 characters to search</p>
          )}

          {query.length >= 2 && !loading && results && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-3xl">🔍</div>
              <p className="font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-muted-foreground">Try different keywords or check spelling</p>
            </div>
          )}

          {/* Players */}
          {results && results.players.length > 0 && (activeType === 'all' || activeType === 'players') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Players</h2>
              <div className="space-y-2">
                {results.players.map((p) => (
                  <Link key={p.id} href={`/player/${p.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-sm shrink-0 overflow-hidden">
                      {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="h-10 w-10 rounded-full object-cover" /> : p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{[p.position, p.nationality].filter(Boolean).join(' · ')}</p>
                      {p.currentTeam && <ClubIdentity name={p.currentTeam.name} badgeUrl={p.currentTeam.badgeUrl} href={`/club/${p.currentTeam.id}`} size="xs" textClassName="text-xs text-muted-foreground" />}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">Player</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Teams */}
          {results && results.teams.length > 0 && (activeType === 'all' || activeType === 'teams') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Teams</h2>
              <div className="space-y-2">
                {results.teams.map((t) => (
                  <Link key={t.id} href={`/club/${t.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0 overflow-hidden">
                      {t.badgeUrl ? <img src={t.badgeUrl} alt={t.name} className="h-8 w-8 object-contain" /> : '🛡️'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.country ?? 'Football Club'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">Team</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Competitions */}
          {results && results.competitions.length > 0 && (activeType === 'all' || activeType === 'competitions') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Competitions</h2>
              <div className="space-y-2">
                {results.competitions.map((c) => (
                  <Link key={c.id} href={`/competition/${c.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0 overflow-hidden">
                      {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="h-8 w-8 object-contain" /> : '🏆'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.country ?? 'Competition'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">League</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Agents */}
          {results && results.agents.length > 0 && (activeType === 'all' || activeType === 'agents') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Agents</h2>
              <div className="space-y-2">
                {results.agents.map((a) => (
                  <Link key={a.id} href={`/agents/${a.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.nationality ?? 'Agent'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">Agent</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Agencies */}
          {results && results.agencies.length > 0 && (activeType === 'all' || activeType === 'agencies') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Agencies</h2>
              <div className="space-y-2">
                {results.agencies.map((a) => (
                  <Link key={a.id} href={`/agencies/${a.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.country ?? 'Agency'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">Agency</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* People */}
          {results && results.users.length > 0 && (activeType === 'all' || activeType === 'users') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">People</h2>
              <div className="space-y-2">
                {results.users.map((u) => (
                  <Link key={u.id} href={`/user/${u.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.handle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">User</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Forum Threads */}
          {results && results.threads.length > 0 && (activeType === 'all' || activeType === 'forums') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Forum Threads</h2>
              <div className="space-y-2">
                {results.threads.map((t) => (
                  <Link key={t.id} href={`/forums/thread/${t.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 text-lg shrink-0">💬</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm line-clamp-1">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category.name} · @{t.author.handle} · {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 rounded-full bg-muted px-2 py-0.5">Forum</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {results && results.posts.length > 0 && (activeType === 'all' || activeType === 'posts') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Posts</h2>
              <div className="space-y-2">
                {results.posts.map((p) => (
                  <Link key={p.id} href={`/feed?post=${p.id}&highlight=1`} className="block rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{p.author.name}</span>
                      <span className="text-xs text-muted-foreground">@{p.author.handle}</span>
                    </div>
                    <p className="text-sm text-foreground/90 line-clamp-3">{p.content}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  )
}
