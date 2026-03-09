"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'

type Scope = 'played' | 'upcoming'

interface TeamMatchItem {
  id: string
  kickoff: string
  status: string
  competition: { id: string; name: string; logoUrl?: string | null }
  isHome: boolean
  opponent: { id: string; name: string; badgeUrl?: string | null }
  score: { for: number; against: number }
  result: 'W' | 'D' | 'L' | null
}

interface Props {
  teamId: string
}

export function TeamMatchesTab({ teamId }: Props) {
  const [scope, setScope] = useState<Scope>('played')
  const [items, setItems] = useState<TeamMatchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(currentScope: Scope) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/football/teams/${teamId}/matches?scope=${currentScope}&limit=20`,
      )
      if (!res.ok) throw new Error('Failed to load matches')
      const json = (await res.json()) as { matches: TeamMatchItem[] }
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
  }, [scope, teamId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Matches</h2>
        <div className="inline-flex gap-1 rounded-full border bg-background p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setScope('played')}
            className={`rounded-full px-2 py-0.5 ${
              scope === 'played' ? 'bg-muted font-semibold' : 'text-muted-foreground'
            }`}
          >
            Played
          </button>
          <button
            type="button"
            onClick={() => setScope('upcoming')}
            className={`rounded-full px-2 py-0.5 ${
              scope === 'upcoming' ? 'bg-muted font-semibold' : 'text-muted-foreground'
            }`}
          >
            Upcoming
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
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{m.competition.name}</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span>{m.isHome ? 'vs' : '@'}</span>
                    <ClubIdentity
                      name={m.opponent.name}
                      badgeUrl={m.opponent.badgeUrl}
                      size="sm"
                      textClassName="font-medium"
                    />
                  </span>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <span className="tabular-nums">
                    {m.score.for} - {m.score.against}
                  </span>
                  <span className="text-muted-foreground">{timeLabel}</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
