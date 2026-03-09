"use client"

import { ClubIdentity } from '@/components/common/ClubIdentity'
import type { MatchDTO } from '@/lib/football/providers/types'

type MatchStats = MatchDTO['stats']
type MatchTeam = MatchDTO['match']['homeTeam']

interface MatchStatsProps {
  stats: MatchStats
  homeTeam: MatchTeam
  awayTeam: MatchTeam
}

export function MatchStats({ stats, homeTeam, awayTeam }: MatchStatsProps) {
  if (!stats) {
    return (
      <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Stats will appear here when available.
      </section>
    )
  }

  const s = stats.normalized

  const rows: Array<{
    label: string
    home: number | null
    away: number | null
  }> = [
    { label: 'Shots', home: s.shotsHome, away: s.shotsAway },
    { label: 'Shots on target', home: s.shotsOnTargetHome, away: s.shotsOnTargetAway },
    { label: 'Possession %', home: s.possessionHome, away: s.possessionAway },
    { label: 'Passes', home: s.passesHome, away: s.passesAway },
    { label: 'Big chances', home: s.bigChancesHome, away: s.bigChancesAway },
    { label: 'xG', home: s.xgHome, away: s.xgAway },
    { label: 'xGA', home: s.xgaHome, away: s.xgaAway },
  ]

  const fmt = (value: number | null): string => {
    if (value == null) return '—'
    return value % 1 === 0 ? String(value) : value.toFixed(2)
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Match stats</h2>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <ClubIdentity name={homeTeam.name} badgeUrl={homeTeam.badgeUrl} size="sm" />
        <ClubIdentity name={awayTeam.name} badgeUrl={awayTeam.badgeUrl} size="sm" />
      </div>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-2 text-xs">
            <span className="text-right font-semibold tabular-nums">{fmt(row.home)}</span>
            <span className="text-center text-[11px] text-muted-foreground">{row.label}</span>
            <span className="font-semibold tabular-nums">{fmt(row.away)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
