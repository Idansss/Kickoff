'use client'

import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { FollowButton } from '@/components/common/FollowButton'

interface PlayerHeaderProps {
  player: {
    id: string
    name: string
    photoUrl?: string | null
    age?: number | null
    dob?: string | null
    nationality?: string | null
    preferredFoot?: string | null
    position?: string | null
    heightCm?: number | null
    currentTeam?: {
      id: string
      name: string
      badgeUrl?: string | null
    } | null
  }
  transferStatus?: {
    type: string
    isOnLoan: boolean
    loanFromTeam?: { id: string; name: string } | null
  }
  contract?: {
    endDate: string
    status: string
    isOnLoan: boolean
    wageEur?: number | null
    releaseClauseEur?: number | null
    club?: { id: string; name: string; badgeUrl?: string | null } | null
  } | null
  agent?: {
    agent?: { id: string; name: string } | null
    agency?: { id: string; name: string } | null
    since?: string | null
  } | null
  value?: string | number | null
  recentForm?: {
    avgRating: number
    matches: number
  } | null
}

export function PlayerHeader({ player, transferStatus, contract, agent, value, recentForm }: PlayerHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-background">
          {player.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photoUrl}
              alt={player.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold">{player.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{player.name}</h1>
          <div className="mt-1 text-xs text-muted-foreground">
            {player.position && <span>{player.position}</span>}
            {player.nationality && (
              <>
                {player.position && <span className="mx-1.5">·</span>}
                <span>{player.nationality}</span>
              </>
            )}
            {player.age != null && (
              <>
                {(player.position || player.nationality) && <span className="mx-1.5">·</span>}
                <span>{player.age} years</span>
              </>
            )}
          </div>
          {player.currentTeam && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">Club: </span>
              <ClubIdentity
                name={player.currentTeam.name}
                badgeUrl={player.currentTeam.badgeUrl}
                href={`/club/${player.currentTeam.id}`}
                size="sm"
                className="align-middle"
                textClassName="font-medium hover:underline"
              />
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {player.preferredFoot && <span>{player.preferredFoot} foot</span>}
            {player.heightCm && <span>{player.heightCm} cm</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-stretch gap-3 text-xs sm:flex-row sm:items-start sm:justify-end">
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Contract
            </p>
            <div className="rounded-full border bg-background px-2 py-1 text-xs">
              {contract
                ? (() => {
                    const end = new Date(contract.endDate)
                    const now = new Date()
                    const monthsLeft = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
                    const urgency = monthsLeft <= 6 ? 'text-red-500' : monthsLeft <= 12 ? 'text-amber-500' : ''
                    return (
                      <span className={urgency}>
                        {contract.isOnLoan
                          ? `On loan · expires ${end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
                          : `Expires ${end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                      </span>
                    )
                  })()
                : transferStatus?.isOnLoan
                ? `On loan from ${transferStatus.loanFromTeam?.name ?? 'unknown'}`
                : '—'}
            </div>
          </div>

          {agent && (agent.agent || agent.agency) && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Agent
              </p>
              <div className="rounded-full border bg-background px-2 py-1 text-xs">
                {agent.agent ? (
                  <Link href={`/agents/${agent.agent.id}`} className="hover:underline">
                    {agent.agent.name}
                  </Link>
                ) : null}
                {agent.agent && agent.agency && <span className="mx-1 text-muted-foreground">·</span>}
                {agent.agency ? (
                  <Link href={`/agencies/${agent.agency.id}`} className="hover:underline text-muted-foreground">
                    {agent.agency.name}
                  </Link>
                ) : null}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Market value
            </p>
            <div className="rounded-full border bg-background px-2 py-1">
              {value ?? '—'}
            </div>
          </div>

          {recentForm && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recent form
              </p>
              <div className="rounded-full border bg-background px-2 py-1">
                Avg rating {recentForm.avgRating} over {recentForm.matches} match
                {recentForm.matches === 1 ? '' : 'es'}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start sm:self-center">
          <FollowButton entityType="PLAYER" entityId={player.id} size="md" />
        </div>
      </div>
    </section>
  )
}
