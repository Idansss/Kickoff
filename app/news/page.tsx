'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { NewsTabs } from '@/components/news/NewsTabs'
import { NewsFilters } from '@/components/news/NewsFilters'
import { NewsCardList, type NewsListItem } from '@/components/news/NewsCardList'

type Scope = 'latest' | 'transfers' | 'league'

interface CompetitionSummary {
  id: string
  name: string
}

interface CompetitionsResponse {
  leagues: CompetitionSummary[]
  cups: CompetitionSummary[]
  international: CompetitionSummary[]
}

async function fetchCompetitions(): Promise<CompetitionSummary[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/football/competitions`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = (await res.json()) as CompetitionsResponse
  return [...json.leagues, ...json.cups, ...json.international]
}

async function fetchNews(
  scope: Scope,
  competitionId: string | null,
  followedOnly: boolean,
): Promise<NewsListItem[]> {
  const params = new URLSearchParams({ scope })
  if (competitionId) params.set('competitionId', competitionId)
  if (followedOnly) params.set('followedOnly', 'true')

  const res = await fetch(`/api/news?${params.toString()}`)
  if (!res.ok) return []
  const json = (await res.json()) as { items: NewsListItem[] }
  return json.items ?? []
}

export default function NewsPage(): React.JSX.Element {
  const [scope, setScope] = useState<Scope>('latest')
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([])
  const [competitionId, setCompetitionId] = useState<string | null>(null)
  const [followedOnly, setFollowedOnly] = useState(false)
  const [teamQuery, setTeamQuery] = useState('')
  const [items, setItems] = useState<NewsListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // load competitions once for filters
    void fetchCompetitions().then((list) => setCompetitions(list))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchNews(scope, competitionId, followedOnly)
        if (!cancelled) setItems(data)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load news.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [scope, competitionId, followedOnly])

  const filteredItems = useMemo(() => {
    if (!teamQuery.trim()) return items
    const q = teamQuery.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.summary ?? '').toLowerCase().includes(q) ||
        (item.source ?? '').toLowerCase().includes(q),
    )
  }, [items, teamQuery])

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">News hub</h1>
              <p className="text-sm text-muted-foreground">
                Latest headlines, transfers and league stories.
              </p>
            </div>
            <NewsTabs scope={scope} onChange={setScope} />
          </div>
        </div>

        <main className="space-y-4 p-4 sm:p-6">
          <NewsFilters
            competitions={competitions}
            competitionId={competitionId}
            onCompetitionChange={setCompetitionId}
            followedOnly={followedOnly}
            onFollowedOnlyChange={setFollowedOnly}
            teamQuery={teamQuery}
            onTeamQueryChange={setTeamQuery}
          />

          {loading && <p className="text-xs text-muted-foreground">Loading news…</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {!loading && !error && filteredItems.length === 0 && (
            <p className="text-xs text-muted-foreground">No news items match your filters.</p>
          )}
          {filteredItems.length > 0 && <NewsCardList items={filteredItems} />}
        </main>
      </div>
    </AppLayout>
  )
}

