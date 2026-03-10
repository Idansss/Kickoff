"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface StandingRow {
  position: number
  team: {
    id: string
    name: string
    badgeUrl?: string | null
  }
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form?: string
}

interface Props {
  competitionId: string
}

export function StandingsTab({ competitionId }: Props) {
  const [rows, setRows] = useState<StandingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/competitions/${competitionId}/standings`)
        if (!res.ok) throw new Error('Failed to load standings')
        const json = (await res.json()) as { rows: StandingRow[] }
        if (!cancelled) setRows(json.rows ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load standings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [competitionId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Standings</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading standings…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">No standings data available.</p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] sm:text-xs">
                <th className="px-2 py-1 text-left font-medium">#</th>
                <th className="px-2 py-1 text-left font-medium">Team</th>
                <th className="px-1 py-1 text-center font-medium">P</th>
                <th className="px-1 py-1 text-center font-medium">W</th>
                <th className="px-1 py-1 text-center font-medium">D</th>
                <th className="px-1 py-1 text-center font-medium">L</th>
                <th className="px-1 py-1 text-center font-medium">GF</th>
                <th className="px-1 py-1 text-center font-medium">GA</th>
                <th className="px-1 py-1 text-center font-medium">GD</th>
                <th className="px-2 py-1 text-right font-medium">Pts</th>
                <th className="px-2 py-1 text-left font-medium">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const formChars = (row.form ?? '').split('').filter(Boolean)
                return (
                  <tr key={row.team.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-2 py-1 text-xs font-medium tabular-nums">{row.position}</td>
                    <td className="px-2 py-1">
                      <Link
                        href={`/club/${row.team.id}`}
                        className="flex items-center gap-2 text-xs sm:text-sm hover:text-green-600 hover:underline"
                      >
                        {row.team.badgeUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.team.badgeUrl}
                            alt={row.team.name}
                            className="h-5 w-5 flex-shrink-0"
                          />
                        ) : null}
                        <span className="truncate">{row.team.name}</span>
                      </Link>
                    </td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.played}</td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.won}</td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.drawn}</td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.lost}</td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.goalsFor}</td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.goalsAgainst}</td>
                    <td className="px-1 py-1 text-center tabular-nums">{row.goalDiff}</td>
                    <td className="px-2 py-1 text-right text-xs font-semibold tabular-nums">
                      {row.points}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-0.5">
                        {formChars.map((ch, index) => (
                          <span
                            key={`${row.team.id}-form-${index}`}
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                              ch === 'W' && 'bg-green-500 text-white',
                              ch === 'D' && 'bg-muted text-muted-foreground',
                              ch === 'L' && 'bg-red-500 text-white'
                            )}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

