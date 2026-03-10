'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { cn } from '@/lib/utils'

type Window = '30d' | '90d' | '365d'
type Scope = 'all' | 'players' | 'clubs'

interface MoverEntry {
  type: 'player' | 'club'
  id: string
  name: string
  badgeUrl?: string | null
  position?: string | null
  currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
  latestValueEur: number
  latestValueFormatted: string
  deltaEur: number
  deltaFormatted: string
  deltaDirection: 'up' | 'down'
  deltaPct: number
}

interface WinnersLosersResponse {
  window: string
  gainers: MoverEntry[]
  losers: MoverEntry[]
}

function MoverRow({ entry }: { entry: MoverEntry }) {
  const href = entry.type === 'player' ? `/player/${entry.id}` : `/club/${entry.id}`
  const isUp = entry.deltaDirection === 'up'

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
      <div className="min-w-0 flex-1">
        {entry.type === 'club' ? (
          <ClubIdentity
            name={entry.name}
            badgeUrl={entry.badgeUrl}
            href={href}
            size="xs"
            textClassName="font-medium hover:underline"
          />
        ) : (
          <div>
            <Link href={href} className="font-medium hover:underline truncate block">
              {entry.name}
            </Link>
            {entry.currentTeam && (
              <ClubIdentity
                name={entry.currentTeam.name}
                badgeUrl={entry.currentTeam.badgeUrl}
                href={`/club/${entry.currentTeam.id}`}
                size="xs"
                textClassName="text-muted-foreground hover:underline"
              />
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-semibold">{entry.latestValueFormatted}</div>
        <div className={cn('text-[11px] font-medium', isUp ? 'text-green-500' : 'text-red-500')}>
          {entry.deltaFormatted}
          <span className="ml-1 text-muted-foreground">({entry.deltaPct}%)</span>
        </div>
      </div>
    </div>
  )
}

export function WinnersLosersPanel() {
  const [win, setWin] = useState<Window>('90d')
  const [scope, setScope] = useState<Scope>('all')
  const [data, setData] = useState<WinnersLosersResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ window: win, scope })
        const res = await fetch(`/api/market-values/winners-losers?${params}`, {
          signal: controller.signal,
        })
        if (res.ok) setData((await res.json()) as WinnersLosersResponse)
      } catch { /* aborted */ } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void run()
    return () => controller.abort()
  }, [win, scope])

  const skeletons = Array.from({ length: 5 })

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Window:</span>
          {(['30d', '90d', '365d'] as Window[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWin(w)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 font-medium transition-colors',
                win === w ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
              )}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Scope:</span>
          {(['all', 'players', 'clubs'] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 font-medium capitalize transition-colors',
                scope === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gainers */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-3 py-2 text-xs font-semibold text-green-600">
            ↑ Biggest gains
          </div>
          <div className="divide-y">
            {loading
              ? skeletons.map((_, i) => (
                  <div key={i} className="animate-pulse px-3 py-2.5">
                    <div className="h-4 w-36 rounded bg-muted" />
                    <div className="mt-1 h-3 w-20 rounded bg-muted" />
                  </div>
                ))
              : (data?.gainers ?? []).length > 0
              ? (data?.gainers ?? []).map((e) => <MoverRow key={`${e.type}-${e.id}`} entry={e} />)
              : (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No significant gains in this window.
                </div>
              )}
          </div>
        </div>

        {/* Losers */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-3 py-2 text-xs font-semibold text-red-500">
            ↓ Biggest drops
          </div>
          <div className="divide-y">
            {loading
              ? skeletons.map((_, i) => (
                  <div key={i} className="animate-pulse px-3 py-2.5">
                    <div className="h-4 w-36 rounded bg-muted" />
                    <div className="mt-1 h-3 w-20 rounded bg-muted" />
                  </div>
                ))
              : (data?.losers ?? []).length > 0
              ? (data?.losers ?? []).map((e) => <MoverRow key={`${e.type}-${e.id}`} entry={e} />)
              : (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No significant drops in this window.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
