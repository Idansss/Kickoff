"use client"

import Link from 'next/link'
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
        <ClubIdentity name={homeTeam.name} badgeUrl={homeTeam.badgeUrl} href={`/club/${homeTeam.id}`} size="sm" />
        <span>Timeline</span>
        <ClubIdentity name={awayTeam.name} badgeUrl={awayTeam.badgeUrl} href={`/club/${awayTeam.id}`} size="sm" />
      </div>
      <ul className="space-y-1.5 text-sm">
        {sorted.map((e) => {
          const isHome = e.teamId === homeTeam.id || e.teamName === homeTeam.name
          const alignClass = isHome ? 'justify-start text-left' : 'justify-end text-right'

          return (
            <li key={e.id} className={`flex ${alignClass} gap-2`}>
              {isHome && (
                <>
                  <span className="w-10 tabular-nums text-xs text-muted-foreground">{e.minute ?? 0}&apos;</span>
                  <span>{getIcon(e.type)}</span>
                  {e.player ? <Link href={`/player/${e.player.id}`} className="hover:underline">{e.player.name}</Link> : <span>Unknown player</span>}
                  {e.assist && <span className="text-xs text-muted-foreground">(<Link href={`/player/${e.assist.id}`} className="hover:underline">{e.assist.name ?? 'assist'}</Link>)</span>}
                </>
              )}
              {!isHome && (
                <>
                  {e.assist && <span className="text-xs text-muted-foreground">(<Link href={`/player/${e.assist.id}`} className="hover:underline">{e.assist.name ?? 'assist'}</Link>)</span>}
                  {e.player ? <Link href={`/player/${e.player.id}`} className="hover:underline">{e.player.name}</Link> : <span>Unknown player</span>}
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
