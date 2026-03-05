'use client'

import type { MomentumSegment } from '@/types'
import { cn } from '@/lib/utils'

interface MomentumBarProps {
  segments: readonly MomentumSegment[]
  className?: string
}

export function MomentumBar({ segments, className }: MomentumBarProps) {
  if (segments.length === 0) return null
  const totalIntensity = segments.reduce((sum, segment) => sum + segment.intensity, 0)

  return (
    <div
      className={cn('flex w-full h-2 rounded-full overflow-hidden bg-muted', className)}
      aria-label="Match momentum"
    >
      {segments.map((segment, index) => (
        <div
          key={`${segment.team}-${index}`}
          className={cn(
            'h-full transition-colors',
            segment.team === 'home' ? 'bg-green-500/80' : 'bg-red-500/80'
          )}
          style={{
            width: `${((segment.intensity || 0) / (totalIntensity || 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}
