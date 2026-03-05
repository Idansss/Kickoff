"use client"

import { useEffect, useState } from 'react'

interface TeamStatsResponse {
  totals: Record<string, number | null>
  perMatch: Record<string, number | null> | null
  matchesPlayed: number
}

interface Props {
  teamId: string
}

export function TeamStatsTab({ teamId }: Props) {
  const [mode, setMode] = useState<'total' | 'per_match'>('total')
  const [data, setData] = useState<TeamStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/football/teams/${teamId}/stats?mode=${mode}`)
      if (!res.ok) throw new Error('Failed to load stats')
      const json = (await res.json()) as TeamStatsResponse
      setData(json)
    } catch (err) {
      console.error(err)
      setError('Unable to load stats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, mode])

  const currentStats = mode === 'total' ? data?.totals : data?.perMatch ?? null

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Team stats</h2>
        <div className="inline-flex gap-1 rounded-full border bg-background p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('total')}
            className={`rounded-full px-2 py-0.5 ${
              mode === 'total' ? 'bg-muted font-semibold' : 'text-muted-foreground'
            }`}
          >
            Total
          </button>
          <button
            type="button"
            onClick={() => setMode('per_match')}
            className={`rounded-full px-2 py-0.5 ${
              mode === 'per_match' ? 'bg-muted font-semibold' : 'text-muted-foreground'
            }`}
          >
            Per match
          </button>
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading stats…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && (!currentStats || Object.keys(currentStats).length === 0) && (
        <p className="text-xs text-muted-foreground">No stats available yet.</p>
      )}

      {currentStats && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {Object.entries(currentStats).map(([key, value]) => (
            <div
              key={key}
              className="rounded-md border bg-background px-2 py-1.5"
            >
              <div className="text-[11px] text-muted-foreground">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </div>
              <div className="mt-0.5 font-semibold tabular-nums">
                {value == null ? '—' : value}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Based on {data.matchesPlayed} finished match{data.matchesPlayed === 1 ? '' : 'es'}.
        </p>
      )}
    </section>
  )
}

