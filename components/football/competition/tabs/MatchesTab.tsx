"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Scope = 'upcoming' | 'played'

interface CompetitionMatchItem {
  id: string
  kickoff: string
  status: string
  homeTeam: { id: string; name: string; badgeUrl?: string | null }
  awayTeam: { id: string; name: string; badgeUrl?: string | null }
  score: { home: number; away: number }
}

interface Props {
  competitionId: string
}

export function MatchesTab({ competitionId }: Props) {
  const [scope, setScope] = useState<Scope>('upcoming')
  const [items, setItems] = useState<CompetitionMatchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(currentScope: Scope) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/football/competitions/${competitionId}/matches?scope=${currentScope}&limit=50`,
      )
      if (!res.ok) throw new Error('Failed to load matches')
      const json = (await res.json()) as { matches: CompetitionMatchItem[] }
      setItems(json.matches ?? [])
    } catch (err) {
      console.error(err)
      setError('Unable to load matches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(scope)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, competitionId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Matches</h2>
        <div className="inline-flex gap-1 rounded-full border bg-background p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setScope('upcoming')}
            className={`rounded-full px-2 py-0.5 ${
              scope === 'upcoming' ? 'bg-muted font-semibold' : 'text-muted-foreground'
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setScope('played')}
            className={`rounded-full px-2 py-0.5 ${
              scope === 'played' ? 'bg-muted font-semibold' : 'text-muted-foreground'
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading matches…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-muted-foreground">No matches for this scope.</p>
      )}

      <ul className="mt-2 space-y-2 text-sm">
        {items.map((m) => {
          const kickoff = new Date(m.kickoff)
          const timeLabel = kickoff.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
          return (
            <li key={m.id}>
              <Link
                href={`/match/${m.id}`}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 hover:bg-muted/60"
              >
                <div className="flex flex-col text-xs sm:text-sm">
                  <span className="font-medium">
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{timeLabel}</span>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <span className="tabular-nums">
                    {m.score.home} - {m.score.away}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{m.status}</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

