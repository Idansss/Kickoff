'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUpRight,
  Clock3,
  FileText,
  Flame,
  Loader2,
  Newspaper,
  Search,
  Shield,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import type { NewsListItem } from '@/components/news/NewsCardList'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchType = 'all' | 'players' | 'teams' | 'posts' | 'users'

interface PlayerResult {
  id: string
  name: string
  position?: string | null
  nationality?: string | null
  photoUrl?: string | null
  currentTeam?: { name: string; badgeUrl?: string | null } | null
}

interface TeamResult {
  id: string
  name: string
  country?: string | null
  badgeUrl?: string | null
}

interface PostResult {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; handle: string; avatar: string }
}

interface UserResult {
  id: string
  name: string
  handle: string
  avatar: string
  bio?: string | null
}

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
  { label: 'Mbappe transfer', query: 'Mbappe', type: 'players' },
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
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      const data = (await res.json()) as SearchResults
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
      router.replace(`/search${params.size ? `?${params.toString()}` : ''}`, { scroll: false })
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

  const activeLabel = TABS.find((tab) => tab.key === activeType)?.label ?? 'All'
  const hasQuery = query.length > 0
  const showNoResults = query.length >= 2 && !loading && results && totalResults === 0

  return (
    <AppLayout>
      <div className="mx-auto min-h-screen max-w-3xl border-x border-border bg-background">
        <div className="sticky top-0 z-10 border-b border-border/80 bg-background/92 backdrop-blur-xl">
          <div className="relative overflow-hidden px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_40%)]" />

            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-green-500/80">
                    Scout The Graph
                  </p>
                  <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                    Search
                  </h1>
                  <p className="max-w-xl text-sm text-muted-foreground sm:text-[15px]">
                    Players, clubs, people, and match chatter, all in one pass.
                  </p>
                </div>

                <div className="hidden rounded-full border border-green-500/20 bg-green-500/8 px-3 py-1.5 text-right text-xs text-muted-foreground sm:block">
                  <div className="font-semibold text-foreground">
                    {hasQuery && query.length >= 2 && !loading ? `${totalResults} results` : 'Live football index'}
                  </div>
                  <div>{hasQuery ? activeLabel : 'Players, teams, posts, people'}</div>
                </div>
              </div>

              <div className="rounded-[30px] border border-green-500/20 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_55%),linear-gradient(180deg,rgba(10,10,10,0.96),rgba(0,0,0,0.98))] p-2 shadow-[0_0_0_1px_rgba(34,197,94,0.05),0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500/80" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search players, teams, posts, people..."
                    className="h-16 rounded-[22px] border-border/70 bg-black/40 pl-12 pr-12 text-lg text-foreground placeholder:text-muted-foreground/75 focus-visible:ring-2 focus-visible:ring-green-500/50"
                  />
                  {loading ? (
                    <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-green-500" />
                  ) : (
                    <Sparkles className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2 px-1 pb-1">
                  {SUGGESTED_QUERIES.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => {
                        setActiveType(suggestion.type ?? 'all')
                        setQuery(suggestion.query)
                      }}
                      className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-green-500/30 hover:bg-green-500/10 hover:text-foreground"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveType(key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      activeType === key
                        ? 'border-green-500/40 bg-green-500/12 text-foreground shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-green-500/25 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-4 py-6 sm:px-6">
          {!hasQuery && (
            <div className="space-y-6">
              <section className="relative overflow-hidden rounded-[30px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_34%),linear-gradient(180deg,rgba(10,10,10,0.92),rgba(0,0,0,0.98))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Discovery Mode
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-5">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/25 bg-green-500/10 text-green-500">
                      <Search className="h-7 w-7" />
                    </div>

                    <div className="space-y-3">
                      <h2 className="max-w-lg text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                        Search for anything football without leaving the flow.
                      </h2>
                      <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                        Jump from a player to a club, from a transfer rumor to a post thread, or from a name to the people talking about it.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {SUGGESTED_QUERIES.map((suggestion, index) => (
                        <button
                          key={suggestion.label}
                          type="button"
                          onClick={() => {
                            setActiveType(suggestion.type ?? 'all')
                            setQuery(suggestion.query)
                          }}
                          className={cn(
                            'group inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-left transition-all',
                            index === 0
                              ? 'border-green-500/30 bg-green-500/10 text-foreground'
                              : 'border-border bg-black/30 text-muted-foreground hover:border-green-500/25 hover:bg-green-500/6 hover:text-foreground'
                          )}
                        >
                          <span className="text-sm font-medium">{suggestion.label}</span>
                          <ArrowUpRight className="h-4 w-4 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Quick lanes
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-border/70 bg-black/30 p-3">
                          <div className="text-green-500">Players</div>
                          <div className="mt-1 text-xs text-muted-foreground">Profiles, form, clubs</div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-black/30 p-3">
                          <div className="text-green-500">Teams</div>
                          <div className="mt-1 text-xs text-muted-foreground">Clubs, tables, squads</div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-black/30 p-3">
                          <div className="text-green-500">People</div>
                          <div className="mt-1 text-xs text-muted-foreground">Fans and creators</div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-black/30 p-3">
                          <div className="text-green-500">Posts</div>
                          <div className="mt-1 text-xs text-muted-foreground">Threads and reactions</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(34,197,94,0.1),rgba(0,0,0,0))] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Flame className="h-4 w-4 text-orange-400" />
                        Trending right now
                      </div>
                      <div className="mt-4 space-y-2">
                        {['Transfer waves', 'Matchday reactions', 'Scout chatter'].map((item, index) => (
                          <div
                            key={item}
                            className="flex items-center justify-between rounded-xl border border-border/70 bg-black/30 px-3 py-2"
                          >
                            <span className="text-sm text-foreground">{item}</span>
                            <span className="text-[11px] text-muted-foreground">0{index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Latest Headlines
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-foreground">News radar</h2>
                    </div>
                    <Link
                      href="/news"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-500 transition-colors hover:text-green-400"
                    >
                      Open news hub
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {newsLoading && !latestNews ? (
                    <p className="text-sm text-muted-foreground">Loading latest news...</p>
                  ) : (latestNews?.length ?? 0) === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                      No headlines available.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {latestNews?.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.url ?? '/news'}
                            className="block rounded-2xl border border-border/80 bg-black/25 px-4 py-3 transition-all hover:border-green-500/25 hover:bg-green-500/6"
                          >
                            <p className="text-sm font-semibold text-foreground line-clamp-2">
                              {item.title}
                            </p>
                            <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                              {item.source ? <span>{item.source}</span> : null}
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>
                                {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                              </span>
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(20,184,166,0.08),rgba(0,0,0,0))] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-500">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Trending Transfers
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-foreground">Market pulse</h2>
                    </div>
                  </div>

                  {newsLoading && !trendingNews ? (
                    <p className="text-sm text-muted-foreground">Loading transfer buzz...</p>
                  ) : (trendingNews?.length ?? 0) === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                      No transfer stories right now.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {trendingNews?.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.url ?? '/news?scope=transfers'}
                            className="block rounded-2xl border border-border/80 bg-black/25 px-4 py-3 transition-all hover:border-green-500/25 hover:bg-green-500/6"
                          >
                            <p className="text-sm font-semibold text-foreground line-clamp-2">
                              {item.title}
                            </p>
                            <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                              {item.source ? <span>{item.source}</span> : null}
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>
                                {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                              </span>
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          )}

          {hasQuery && query.length < 2 && (
            <div className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(34,197,94,0.08),rgba(0,0,0,0))] px-5 py-6 text-center">
              <p className="text-sm font-medium text-foreground">Type at least 2 characters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start broad, then switch tabs to narrow the lane.
              </p>
            </div>
          )}

          {showNoResults && (
            <div className="rounded-[30px] border border-border bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.14),transparent_45%),linear-gradient(180deg,rgba(10,10,10,0.92),rgba(0,0,0,0.98))] px-6 py-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10 text-green-500">
                <Search className="h-9 w-9" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-foreground">
                No results for &ldquo;{query}&rdquo;
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a club, competition, player surname, or a broader football phrase.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUERIES.slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => {
                      setActiveType(suggestion.type ?? 'all')
                      setQuery(suggestion.query)
                    }}
                    className="rounded-full border border-border bg-black/35 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-green-500/25 hover:text-foreground"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {results && results.players.length > 0 && (activeType === 'all' || activeType === 'players') && (
            <section className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(0,0,0,0))] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Players
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Player matches</h2>
                </div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-500">
                  {results.players.length}
                </span>
              </div>

              <div className="space-y-3">
                {results.players.map((player) => (
                  <Link
                    key={player.id}
                    href={`/player/${player.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-black/25 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-green-500/30 hover:bg-green-500/6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-green-500/10 text-sm font-bold text-green-500">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
                      ) : (
                        player.name.split(' ').map((part) => part[0]).join('').slice(0, 2)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Player
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {[player.position, player.currentTeam?.name, player.nationality].filter(Boolean).join(' | ')}
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-500" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results && results.teams.length > 0 && (activeType === 'all' || activeType === 'teams') && (
            <section className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(20,184,166,0.08),rgba(0,0,0,0))] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Teams
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Club matches</h2>
                </div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-500">
                  {results.teams.length}
                </span>
              </div>

              <div className="space-y-3">
                {results.teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/club/${team.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-black/25 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-green-500/30 hover:bg-green-500/6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-muted text-lg">
                      {team.badgeUrl ? (
                        <img src={team.badgeUrl} alt={team.name} className="h-9 w-9 object-contain" />
                      ) : (
                        'FC'
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{team.name}</p>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Team
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {team.country ?? 'Football Club'}
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-500" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results && results.users.length > 0 && (activeType === 'all' || activeType === 'users') && (
            <section className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(0,0,0,0))] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    People
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Fans and creators</h2>
                </div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-500">
                  {results.users.length}
                </span>
              </div>

              <div className="space-y-3">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-black/25 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-green-500/30 hover:bg-green-500/6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-green-600 text-sm font-bold text-white">
                      {user.name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          User
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">@{user.handle}</p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-500" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results && results.posts.length > 0 && (activeType === 'all' || activeType === 'posts') && (
            <section className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(250,204,21,0.05),rgba(0,0,0,0))] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Posts
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Conversation matches</h2>
                </div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-500">
                  {results.posts.length}
                </span>
              </div>

              <div className="space-y-3">
                {results.posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/feed?post=${post.id}&highlight=1`}
                    className="group block rounded-2xl border border-border/80 bg-black/25 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-green-500/30 hover:bg-green-500/6"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-green-600 text-xs font-bold text-white">
                        {post.author.name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{post.author.name}</p>
                          <span className="text-xs text-muted-foreground">@{post.author.handle}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-500" />
                    </div>

                    <p className="text-sm leading-6 text-foreground/90 line-clamp-3">{post.content}</p>
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
