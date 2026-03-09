'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, User, Users, FileText, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { NewsListItem } from '@/components/news/NewsCardList'

type SearchType = 'all' | 'players' | 'teams' | 'posts' | 'users'

interface PlayerResult {
  id: string
  name: string
  position?: string | null
  nationality?: string | null
  photoUrl?: string | null
  currentTeam?: { name: string; badgeUrl?: string | null } | null
}
interface TeamResult { id: string; name: string; country?: string | null; badgeUrl?: string | null }
interface PostResult { id: string; content: string; createdAt: string; author: { id: string; name: string; handle: string; avatar: string } }
interface UserResult { id: string; name: string; handle: string; avatar: string; bio?: string | null }

interface SearchResults {
  players: PlayerResult[]
  teams: TeamResult[]
  posts: PostResult[]
  users: UserResult[]
}

const TABS: { key: SearchType; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Search },
  { key: 'players', label: 'Players', icon: User },
  { key: 'teams', label: 'Teams', icon: Shield },
  { key: 'users', label: 'People', icon: Users },
  { key: 'posts', label: 'Posts', icon: FileText },
]

const SUGGESTED_QUERIES: { label: string; query: string; type?: SearchType }[] = [
  { label: 'Haaland goals', query: 'Haaland', type: 'players' },
  { label: 'Premier League table', query: 'Premier League', type: 'teams' },
  { label: 'UCL highlights', query: 'UCL', type: 'posts' },
  { label: 'Mbappé transfer', query: 'Mbappe', type: 'players' },
  { label: 'Barcelona fixtures', query: 'Barcelona', type: 'teams' },
  { label: 'Fantasy gems', query: 'Fantasy sleeper picks', type: 'posts' },
]

function SearchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const initialType = (searchParams.get('type') as SearchType) ?? 'all'

  const [query, setQuery] = useState(initialQ)
  const [activeType, setActiveType] = useState<SearchType>(initialType)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
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

  useEffect(() => {
    let cancelled = false
    async function loadNews() {
      try {
        setNewsLoading(true)
        const [latestRes, transfersRes] = await Promise.all([
          fetch('/api/news?scope=latest'),
          fetch('/api/news?scope=transfers'),
        ])
        const latestJson = (await latestRes.json()) as { items?: NewsListItem[] }
        const transfersJson = (await transfersRes.json()) as { items?: NewsListItem[] }
        if (!cancelled) {
          setLatestNews(latestJson.items ?? [])
          setTrendingNews(transfersJson.items ?? [])
        }
      } catch {
        if (!cancelled) {
          setLatestNews([])
          setTrendingNews([])
        }
      } finally {
        if (!cancelled) setNewsLoading(false)
      }
    }
    void loadNews()
    return () => {
      cancelled = true
    }
  }, [])

  const totalResults = results
    ? results.players.length + results.teams.length + results.posts.length + results.users.length
    : 0

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 pt-4 pb-0 sm:px-6">
          <h1 className="text-xl font-bold mb-3">Search</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players, teams, posts, people…"
              className="pl-9"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex -mb-px gap-0 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveType(key)}
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

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {!query && (
            <div className="space-y-8 pt-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Search for anything football</p>
              </div>

              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Suggested searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        setActiveType(s.type ?? 'all')
                        setQuery(s.query)
                      }}
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
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Latest headlines
                    </h2>
                    <Link href="/news" className="text-[11px] text-green-600 hover:underline">
                      Open news hub
                    </Link>
                  </div>
                  {newsLoading && !latestNews && (
                    <p className="text-xs text-muted-foreground">Loading latest news…</p>
                  )}
                  {!newsLoading && (latestNews?.length ?? 0) === 0 && (
                    <p className="text-xs text-muted-foreground">No headlines available.</p>
                  )}
                  <ul className="space-y-2">
                    {latestNews?.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.url ?? '/news'}
                          className="block rounded-lg border border-border/60 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors"
                        >
                          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
                            {item.source && <span>{item.source}</span>}
                            <span>
                              {formatDistanceToNow(new Date(item.publishedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Trending transfers
                  </h2>
                  {newsLoading && !trendingNews && (
                    <p className="text-xs text-muted-foreground">Loading transfer buzz…</p>
                  )}
                  {!newsLoading && (trendingNews?.length ?? 0) === 0 && (
                    <p className="text-xs text-muted-foreground">No transfer stories right now.</p>
                  )}
                  <ul className="space-y-2">
                    {trendingNews?.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.url ?? '/news?scope=transfers'}
                          className="block rounded-lg border border-border/60 bg-muted/10 px-3 py-2 hover:bg-muted/30 transition-colors"
                        >
                          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
                            {item.source && <span>{item.source}</span>}
                            <span>
                              {formatDistanceToNow(new Date(item.publishedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}

          {query && query.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-8">Type at least 2 characters</p>
          )}

          {query.length >= 2 && !loading && results && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-3xl">🔍</div>
              <p className="font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-muted-foreground">Try different keywords</p>
            </div>
          )}

          {/* Players */}
          {results && results.players.length > 0 && (activeType === 'all' || activeType === 'players') && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Players</h2>
              <div className="space-y-2">
                {results.players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/player/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        p.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.position, p.currentTeam?.name, p.nationality].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">Player</span>
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
                  <Link
                    key={t.id}
                    href={`/club/${t.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                      {t.badgeUrl ? (
                        <img src={t.badgeUrl} alt={t.name} className="h-8 w-8 object-contain" />
                      ) : '🛡️'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.country ?? 'Football Club'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">Team</span>
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
                  <Link
                    key={u.id}
                    href={`/user/${u.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.handle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">User</span>
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
                  <Link
                    key={p.id}
                    href={`/feed?post=${p.id}&highlight=1`}
                    className="block rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
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
