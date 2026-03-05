'use client'

import type { MatchEvent } from '@/types'
import { cn } from '@/lib/utils'

interface MatchTimelineProps {
  events: MatchEvent[]
  className?: string
}

const EVENT_ICONS: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  yellow: '🟨',
  red: '🟥',
  sub: '🔄',
  var: '📺',
}

export function MatchTimeline({ events, className }: MatchTimelineProps) {
  if (events.length === 0) return null
  const sorted = [...events].sort((a, b) => a.minute - b.minute)
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">Timeline</p>
      <ul className="space-y-1.5">
        {sorted.map((e, i) => (
          <li
            key={`${e.minute}-${e.type}-${i}`}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-muted-foreground tabular-nums w-8">{e.minute}&apos;</span>
            <span>{EVENT_ICONS[e.type]}</span>
            <span className={e.team === 'home' ? 'text-green-600' : 'text-red-600'}>
              {e.playerName}
            </span>
            {e.detail && (
              <span className="text-muted-foreground text-xs">{e.detail}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
