/* eslint-disable @next/next/no-img-element */
'use client'

import { FollowButton } from '@/components/common/FollowButton'
import { NotificationToggles } from '@/components/football/team/NotificationToggles'

interface TeamOverview {
  id: string
  name: string
  badgeUrl?: string | null
  country?: string | null
  venue?: string | null
  coachName?: string | null
  form?: string[]
  tableSnapshot?: {
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    points: number
  } | null
}

interface TeamHeaderProps {
  team: TeamOverview
}

export function TeamHeader({ team }: TeamHeaderProps) {
  const form = team.form ?? []

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-background">
          {team.badgeUrl ? (
            <img
              src={team.badgeUrl}
              alt={team.name}
              className="h-12 w-12 object-contain"
            />
          ) : (
            <span className="text-xl font-bold">{team.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{team.name}</h1>
          <div className="text-xs text-muted-foreground">
            {team.country && <span>{team.country}</span>}
            {team.venue && (
              <>
                {team.country && <span className="mx-1.5">·</span>}
                <span>{team.venue}</span>
              </>
            )}
          </div>
          {team.coachName && (
            <p className="mt-1 text-xs text-muted-foreground">Coach: {team.coachName}</p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-end">
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Recent form
            </p>
            <div className="flex gap-1">
              {form.length === 0 && (
                <span className="text-xs text-muted-foreground">No recent matches</span>
              )}
              {form.map((f, idx) => {
                const color =
                  f === 'W'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : f === 'D'
                      ? 'bg-muted'
                      : 'bg-red-500/20 text-red-500'
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <span
                    key={idx}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${color}`}
                  >
                    {f}
                  </span>
                )
              })}
            </div>
          </div>

          {team.tableSnapshot && (
            <div className="rounded-lg border bg-background px-3 py-2 text-[11px]">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-semibold tabular-nums">{team.tableSnapshot.points}</div>
                  <div className="text-[10px] text-muted-foreground">Points</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="font-semibold tabular-nums">
                    {team.tableSnapshot.wins}-{team.tableSnapshot.draws}-{team.tableSnapshot.losses}
                  </div>
                  <div className="text-[10px] text-muted-foreground">W-D-L</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:w-64">
          <FollowButton entityType="TEAM" entityId={team.id} size="md" />
          <NotificationToggles teamId={team.id} />
        </div>
      </div>
    </section>
  )
}

