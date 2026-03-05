"use client"

import Link from 'next/link'

type CalendarMatch = {
  id: string
  kickoff: string
  status: string
  competition: { id: string; name: string; logoUrl?: string | null }
  homeTeam: { id: string; name: string; badgeUrl?: string | null; score?: number | null }
  awayTeam: { id: string; name: string; badgeUrl?: string | null; score?: number | null }
}

export default function MatchCard({ match }: { match: CalendarMatch }) {
  const kickoffTime = new Date(match.kickoff)
  const timeLabel = kickoffTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-lg border bg-background p-3 transition hover:bg-muted/60"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{match.competition?.name}</span>
        <span>{timeLabel}</span>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <div className="truncate font-medium">{match.homeTeam?.name}</div>
        <div className="rounded-md bg-muted px-2 py-1 text-center text-xs font-semibold">
          {match.homeTeam?.score ?? '-'} : {match.awayTeam?.score ?? '-'}
        </div>
        <div className="truncate text-right font-medium">{match.awayTeam?.name}</div>
      </div>

      <div className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        Status: {match.status}
      </div>
    </Link>
  )
}

