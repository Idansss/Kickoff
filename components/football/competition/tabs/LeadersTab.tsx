"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface LeaderItem {
  playerId: string
  playerName: string
  teamName: string
  value: number
}

interface LeadersResponse {
  topScorers: LeaderItem[]
  topAssists: LeaderItem[]
  topRatings: LeaderItem[]
}

interface Props {
  competitionId: string
}

export function LeadersTab({ competitionId }: Props) {
  const [data, setData] = useState<LeadersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/competitions/${competitionId}/leaders`)
        if (!res.ok) throw new Error('Failed to load leaders')
        const json = (await res.json()) as LeadersResponse
        if (!cancelled) setData(json)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load leaders.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [competitionId])

  const sections: Array<{ key: keyof LeadersResponse; title: string; unit: string }> = [
    { key: 'topScorers', title: 'Top scorers', unit: 'goals' },
    { key: 'topAssists', title: 'Top assists', unit: 'assists' },
    { key: 'topRatings', title: 'Top ratings', unit: 'rating' },
  ]

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Leaders</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading leaders…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && data && data.topScorers.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Leaderboards will appear here once player stats are available.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section) => {
          const items = data ? data[section.key] : []
          return (
            <div key={section.key} className="rounded-xl border border-border bg-background p-3">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                {section.title}
              </h3>
              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No data yet.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {items.slice(0, 5).map((item, index) => (
                    <li
                      key={item.playerId}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-[11px] text-muted-foreground tabular-nums">
                          {index + 1}.
                        </span>
                        <div>
                          <Link href={`/player/${item.playerId}`} className="font-medium hover:underline">{item.playerName}</Link>
                          <div className="text-[11px] text-muted-foreground">{item.teamName}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums">
                        {item.value} {section.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

