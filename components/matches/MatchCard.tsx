'use client'

import { memo, useMemo } from 'react'
import type { Match } from '@/types'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  className?: string
}

function formatKickoff(iso: string | undefined): string {
  if (!iso) return '—'
  const kickoff = new Date(iso)
  return kickoff.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function MatchCardComponent({ match, className }: MatchCardProps): React.JSX.Element {
  const isLive = match.status === 'live'
  const kickoffLabel = useMemo(() => formatKickoff(match.kickoffTime), [match.kickoffTime])

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        isLive && 'border-red-500/40 bg-red-500/5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          {match.competitionFlag} {match.competition}
        </span>
        {isLive ? (
          <div className="flex items-center gap-1.5" role="status" aria-label="Live match in progress">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-500">{match.minute}&apos;</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">{kickoffLabel}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-sm">{match.home.name}</span>
        <span className={cn('text-xl font-bold tabular-nums', isLive && 'text-red-500')}>
          {match.home.score} - {match.away.score}
        </span>
        <span className="font-semibold text-sm text-right">{match.away.name}</span>
      </div>
    </div>
  )
}

export const MatchCard = memo(MatchCardComponent)
