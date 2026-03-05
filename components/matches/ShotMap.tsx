'use client'

import { memo } from 'react'
import type { Shot } from '@/types'
import { cn } from '@/lib/utils'

interface ShotMapProps {
  shots: readonly Shot[]
  className?: string
}

const OUTCOME_COLORS: Record<Shot['outcome'], string> = {
  goal: '#22c55e',
  saved: '#ffffff',
  missed: '#ef4444',
  blocked: '#f59e0b',
}

function ShotMapComponent({ shots, className }: ShotMapProps): React.JSX.Element | null {
  if (shots.length === 0) return null
  // Pitch half: x is distance from goal (0 = goal line), y is width. Normalize to 0-100.
  return (
    <div className={cn('rounded-lg border border-border bg-muted/20 overflow-hidden', className)}>
      <p className="text-xs font-medium text-muted-foreground px-2 py-1">Shot map</p>
      <div className="relative w-full aspect-[3/2] max-h-32">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
          aria-label="Shot map"
        >
          <rect x="0" y="0" width="100" height="100" fill="rgba(34, 197, 94, 0.08)" />
          {shots.map((s, i) => (
            <circle
              key={`${s.minute}-${i}`}
              cx={s.x}
              cy={s.y}
              r={4}
              fill={OUTCOME_COLORS[s.outcome]}
              className="drop-shadow-sm"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

export const ShotMap = memo(ShotMapComponent)
