"use client"

import { useEffect, useState } from 'react'
import type { MatchDTO } from '@/lib/football/providers/types'

interface LiveAutoRefreshProps {
  matchId: string
  initial: MatchDTO
  isLive: boolean
  children: (data: MatchDTO) => React.ReactNode
}

export function LiveAutoRefresh({ matchId, initial, isLive, children }: LiveAutoRefreshProps) {
  const [data, setData] = useState<MatchDTO>(initial)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/football/matches/${matchId}`, { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as MatchDTO
        setData(json)
      } catch {
        // ignore transient errors
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [isLive, matchId])

  return <>{children(data)}</>
}

