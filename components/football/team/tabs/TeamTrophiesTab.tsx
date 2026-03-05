"use client"

import { useEffect, useState } from 'react'

interface TrophyGroup {
  competitionId: string | null
  competitionName: string
  items: {
    seasonLabel: string | null
    count: number
  }[]
}

interface Props {
  teamId: string
}

export function TeamTrophiesTab({ teamId }: Props) {
  const [groups, setGroups] = useState<TrophyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/teams/${teamId}/trophies`)
        if (!res.ok) throw new Error('Failed to load trophies')
        const json = (await res.json()) as { trophiesByCompetition: TrophyGroup[] }
        if (!cancelled) setGroups(json.trophiesByCompetition ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load trophies.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [teamId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Trophies</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading trophies…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && groups.length === 0 && (
        <p className="text-xs text-muted-foreground">No trophies recorded for this team.</p>
      )}
      <div className="grid gap-3 text-xs sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.competitionId ?? g.competitionName} className="rounded-lg border bg-background p-3">
            <div className="mb-1 text-sm font-semibold">{g.competitionName}</div>
            <ul className="space-y-1">
              {g.items.map((item, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={idx} className="flex items-center justify-between">
                  <span>{item.seasonLabel ?? 'Season'}</span>
                  <span className="font-semibold tabular-nums">x{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

