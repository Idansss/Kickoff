"use client"

import { ClubIdentity } from '@/components/common/ClubIdentity'
import type { MatchDTO } from '@/lib/football/providers/types'

type MatchEventDTO = MatchDTO['events'][number]
type MatchTeam = MatchDTO['match']['homeTeam']

interface MatchTimelineProps {
  events: MatchEventDTO[]
  homeTeam: MatchTeam
  awayTeam: MatchTeam
}

const EVENT_ICON_MAP: Record<string, string> = {
  goal: '⚽',
  yellow: '🟨',
  red: '🟥',
  card: '🟥',
  sub: '🔄',
}

function getIcon(type: string): string {
  const key = type.toLowerCase()
  return EVENT_ICON_MAP[key] ?? '•'
}

export function MatchTimeline({ events, homeTeam, awayTeam }: MatchTimelineProps) {
  if (!events.length) return null

  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  return (
    <section className="space-y-2 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <ClubIdentity name={homeTeam.name} badgeUrl={homeTeam.badgeUrl} size="sm" />
        <span>Timeline</span>
        <ClubIdentity name={awayTeam.name} badgeUrl={awayTeam.badgeUrl} size="sm" />
      </div>
      <ul className="space-y-1.5 text-sm">
        {sorted.map((e) => {
          const isHome = e.teamId === homeTeam.id || e.teamName === homeTeam.name
          const alignClass = isHome ? 'justify-start text-left' : 'justify-end text-right'
          const playerName = e.player?.name ?? 'Unknown player'

          return (
            <li key={e.id} className={`flex ${alignClass} gap-2`}>
              {isHome && (
                <>
                  <span className="w-10 tabular-nums text-xs text-muted-foreground">{e.minute ?? 0}&apos;</span>
                  <span>{getIcon(e.type)}</span>
                  <span>{playerName}</span>
                  {e.assist && (
                    <span className="text-xs text-muted-foreground">({e.assist.name ?? 'assist'})</span>
                  )}
                </>
              )}
              {!isHome && (
                <>
                  {e.assist && (
                    <span className="text-xs text-muted-foreground">({e.assist.name ?? 'assist'})</span>
                  )}
                  <span>{playerName}</span>
                  <span>{getIcon(e.type)}</span>
                  <span className="w-10 tabular-nums text-xs text-muted-foreground">{e.minute ?? 0}&apos;</span>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
