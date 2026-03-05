'use client'

import { cn } from '@/lib/utils'

type Variant = 'post' | 'match' | 'player'

interface SkeletonLoaderProps {
  variant: Variant
  className?: string
}

export function SkeletonLoader({ variant, className }: SkeletonLoaderProps) {
  if (variant === 'post') {
    return (
      <div className={cn('border-b border-border px-4 py-4 sm:px-6 animate-pulse', className)}>
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-4/5 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'match') {
    return (
      <div className={cn('rounded-xl border border-border p-4 animate-pulse', className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="flex flex-1 flex-row-reverse items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'player') {
    return (
      <div className={cn('flex items-center gap-4 rounded-lg border border-border p-4 animate-pulse', className)}>
        <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        <div className="h-6 w-12 bg-muted rounded" />
      </div>
    )
  }

  return null
}
