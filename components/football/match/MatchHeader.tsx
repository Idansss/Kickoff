'use client'

import { ClubIdentity } from '@/components/common/ClubIdentity'
import type { MatchDTO } from '@/lib/football/providers/types'
import { FollowButton } from '@/components/common/FollowButton'
import { MatchNotifyButton } from '@/components/football/match/MatchNotifyButton'

type MatchCore = MatchDTO['match']

interface MatchHeaderProps {
  match: MatchCore
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const kickoff = new Date(match.kickoff)
  const dateLabel = kickoff.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeLabel = kickoff.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  const statusLabel =
    match.status === 'LIVE'
      ? 'Live'
      : match.status === 'FINISHED'
        ? 'Full time'
        : match.status === 'SCHEDULED'
          ? 'Scheduled'
          : match.status

  return (
    <header className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {match.competition.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.competition.logoUrl}
            alt={match.competition.name}
            className="h-6 w-6 rounded-full border bg-background object-contain"
          />
        ) : null}
        <span className="font-medium">{match.competition.name}</span>
        <span className="mx-2 h-1 w-1 rounded-full bg-muted-foreground/40" />
        <span>
          {dateLabel} · {timeLabel}
        </span>
        {match.venue && (
          <>
            <span className="mx-2 h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>{match.venue}</span>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-1 justify-center">
          <ClubIdentity
            name={match.homeTeam.name}
            badgeUrl={match.homeTeam.badgeUrl}
            href={`/club/${match.homeTeam.id}`}
            size="lg"
            className="flex-col gap-2"
            textClassName="text-sm font-semibold"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs">
            {match.status === 'LIVE' && (
              <span className="flex items-center gap-1 text-red-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="font-semibold uppercase">Live</span>
              </span>
            )}
            {match.status !== 'LIVE' && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {statusLabel}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 text-3xl font-bold tabular-nums">
            <span>{match.homeTeam.score ?? '-'}</span>
            <span className="text-lg text-muted-foreground">:</span>
            <span>{match.awayTeam.score ?? '-'}</span>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <ClubIdentity
            name={match.awayTeam.name}
            badgeUrl={match.awayTeam.badgeUrl}
            href={`/club/${match.awayTeam.id}`}
            size="lg"
            className="flex-col gap-2"
            textClassName="text-sm font-semibold"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:justify-end flex-wrap">
        <FollowButton entityType="MATCH" entityId={match.id} size="md" />
        {match.status === 'SCHEDULED' && (
          <MatchNotifyButton
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam.name}
            competition={match.competition.name}
            kickoffTime={`${dateLabel} ${timeLabel}`}
            matchId={match.id}
          />
        )}
      </div>
    </header>
  )
}
