"use client"

import { useEffect, useState } from 'react'

interface TableSnapshot {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

interface OverviewResponse {
  team: {
    tableSnapshot?: TableSnapshot | null
  }
}

interface Props {
  teamId: string
}

export function TeamTableTab({ teamId }: Props) {
  const [snapshot, setSnapshot] = useState<TableSnapshot | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/teams/${teamId}/overview`)
        if (!res.ok) throw new Error('Failed to load table snapshot')
        const json = (await res.json()) as OverviewResponse
        if (!cancelled) setSnapshot(json.team.tableSnapshot ?? null)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load table snapshot.')
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
      <h2 className="mb-3 text-sm font-semibold">Table</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading table snapshot…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && !snapshot && (
        <p className="text-xs text-muted-foreground">No table data available yet.</p>
      )}
      {snapshot && (
        <div className="text-xs">
          <div className="mb-2 flex items-center justify-between">
            <span>Played</span>
            <span className="font-semibold tabular-nums">{snapshot.played}</span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span>W-D-L</span>
            <span className="font-semibold tabular-nums">
              {snapshot.wins}-{snapshot.draws}-{snapshot.losses}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span>Goals</span>
            <span className="font-semibold tabular-nums">
              {snapshot.goalsFor} : {snapshot.goalsAgainst}
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between">
            <span>Points</span>
            <span className="font-semibold tabular-nums">{snapshot.points}</span>
          </div>
        </div>
      )}
    </section>
  )
}

