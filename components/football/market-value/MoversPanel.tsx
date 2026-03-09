'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { cn } from '@/lib/utils'

interface MoverEntry {
  type: 'player' | 'club'
  id: string
  name: string
  badgeUrl?: string | null
  position?: string | null
  currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
  latestValueFormatted: string
  deltaFormatted: string
  deltaDirection: 'up' | 'down'
}

interface MoversData {
  gainers: MoverEntry[]
  losers: MoverEntry[]
}

function MoverRow({ entry }: { entry: MoverEntry }) {
  const href = entry.type === 'player' ? `/player/${entry.id}` : `/club/${entry.id}`
  const isGainer = entry.deltaDirection === 'up'

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {entry.type === 'club' ? (
            <ClubIdentity
              name={entry.name}
              badgeUrl={entry.badgeUrl}
              href={href}
              size="xs"
              textClassName="truncate text-xs font-medium hover:underline"
            />
          ) : (
            <Link href={href} className="truncate text-xs font-medium hover:underline">
              {entry.name}
            </Link>
          )}
          {entry.position && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              {entry.position}
            </span>
          )}
        </div>
        {entry.type === 'player' && entry.currentTeam && (
          <div className="text-[11px] text-muted-foreground">
            <ClubIdentity
              name={entry.currentTeam.name}
              badgeUrl={entry.currentTeam.badgeUrl}
              href={`/club/${entry.currentTeam.id}`}
              size="xs"
              textClassName="hover:underline text-muted-foreground"
            />
          </div>
        )}
      </div>
      <div className="shrink-0 text-right text-xs">
        <div className="font-semibold">{entry.latestValueFormatted}</div>
        <div className={cn('text-[11px] font-medium', isGainer ? 'text-green-500' : 'text-red-500')}>
          {entry.deltaFormatted}
        </div>
      </div>
    </div>
  )
}

export function MoversPanel() {
  const [data, setData] = useState<MoversData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/market-values/movers?limit=10&scope=all', {
          signal: controller.signal,
        })
        if (!res.ok) return
        setData((await res.json()) as MoversData)
      } catch {
        // aborted
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void run()
    return () => controller.abort()
  }, [])

  const entries = tab === 'gainers' ? (data?.gainers ?? []) : (data?.losers ?? [])

  return (
    <div className="rounded-xl border bg-card">
      {/* Tab toggle */}
      <div className="flex border-b">
        {(['gainers', 'losers'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold capitalize transition-colors',
              tab === t
                ? t === 'gainers'
                  ? 'border-b-2 border-green-500 text-green-500'
                  : 'border-b-2 border-red-500 text-red-500'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'gainers' ? '↑ Biggest rises' : '↓ Biggest drops'}
          </button>
        ))}
      </div>

      <div className="divide-y">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse px-3 py-2.5">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="mt-1 h-3 w-24 rounded bg-muted" />
              </div>
            ))
          : entries.length > 0
          ? entries.map((e) => <MoverRow key={`${e.type}-${e.id}`} entry={e} />)
          : (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No significant movers found.
              </div>
            )}
      </div>
    </div>
  )
}
