"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'

interface PlayerMatchRow {
  matchId: string
  date: string
  competition: { id: string; name: string }
  opponent: { id: string; name: string; badgeUrl?: string | null }
  teamId: string
  isHome: boolean
  minutes: { inMin: number | null; outMin: number | null; playedMinutes: number }
  contributions: { goals: number; assists: number }
  cards: { yellow: number; red: number }
  rating?: number | null
  result?: string | null
}

interface Props {
  playerId: string
}

export function PlayerMatchLog({ playerId }: Props) {
  const [rows, setRows] = useState<PlayerMatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/players/${playerId}/matches`)
        if (!res.ok) throw new Error('Failed to load match log')
        const json = (await res.json()) as { matches: PlayerMatchRow[] }
        if (!cancelled) setRows(json.matches ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load match log.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [playerId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Match log</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading match log…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">No match data yet.</p>
      )}

      {rows.length > 0 && (
        <div className="mt-2 space-y-2 text-xs">
          {rows.map((row) => {
            const date = new Date(row.date)
            const dateLabel = date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
            const mins = row.minutes.playedMinutes
            const ratingLabel = row.rating != null ? row.rating.toFixed(1) : '—'

            return (
              <Link
                key={row.matchId}
                href={`/match/${row.matchId}`}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 hover:bg-muted/60"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    {dateLabel} · {row.competition.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span>{row.isHome ? 'vs' : '@'}</span>
                    <ClubIdentity
                      name={row.opponent.name}
                      badgeUrl={row.opponent.badgeUrl}
                      size="sm"
                      textClassName="font-medium"
                    />
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    {mins} min · G{row.contributions.goals} A{row.contributions.assists}{' '}
                    {row.cards.yellow > 0 && '· 🟨'}
                    {row.cards.red > 0 && '· 🟥'}
                    {row.result ? ` · ${row.result}` : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold">
                    Rating {ratingLabel}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
