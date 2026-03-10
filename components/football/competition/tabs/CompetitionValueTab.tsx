'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'

interface CompetitionValueData {
  competitionId: string
  totalValue: { eur: number; formatted: string }
  avgValuePerPlayer: { eur: number; formatted: string }
  topClubs: Array<{ id: string; name: string; badgeUrl?: string | null; valueFormatted: string; valueEur: number }>
  topPlayers: Array<{
    rank: number
    id: string
    name: string
    position?: string | null
    nationality?: string | null
    age?: number | null
    currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
    valueFormatted: string
    valueEur: number
  }>
}

export function CompetitionValueTab({ competitionId }: { competitionId: string }) {
  const [data, setData] = useState<CompetitionValueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/market-values/competition-value?competitionId=${competitionId}`)
        if (res.ok && !cancelled) setData((await res.json()) as CompetitionValueData)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [competitionId])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />)}
        </div>
        <div className="h-48 animate-pulse rounded-xl border bg-muted" />
      </div>
    )
  }

  if (!data || (data.topClubs.length === 0 && data.topPlayers.length === 0)) {
    return (
      <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        Market value data is not available for this competition yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-[11px] text-muted-foreground">Total league value</p>
          <p className="mt-0.5 text-xl font-bold">{data.totalValue.formatted}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-[11px] text-muted-foreground">Avg value per player</p>
          <p className="mt-0.5 text-xl font-bold">{data.avgValuePerPlayer.formatted}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top clubs by squad value */}
        {data.topClubs.length > 0 && (
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top clubs by squad value
            </div>
            <div className="divide-y">
              {data.topClubs.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 font-mono text-muted-foreground">{i + 1}</span>
                    <ClubIdentity
                      name={c.name}
                      badgeUrl={c.badgeUrl}
                      href={`/club/${c.id}`}
                      size="xs"
                      textClassName="font-medium hover:underline"
                    />
                  </div>
                  <span className="font-semibold">{c.valueFormatted}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most valuable players */}
        {data.topPlayers.length > 0 && (
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Most valuable players
            </div>
            <div className="divide-y">
              {data.topPlayers.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 shrink-0 font-mono text-muted-foreground">{p.rank}</span>
                    <div className="min-w-0">
                      <Link href={`/player/${p.id}`} className="font-medium hover:underline truncate block">
                        {p.name}
                      </Link>
                      <div className="flex gap-1 text-muted-foreground">
                        {p.position && <span>{p.position}</span>}
                        {p.currentTeam && (
                          <>
                            <span>·</span>
                            <ClubIdentity
                              name={p.currentTeam.name}
                              badgeUrl={p.currentTeam.badgeUrl}
                              href={`/club/${p.currentTeam.id}`}
                              size="xs"
                              textClassName="hover:underline"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold">{p.valueFormatted}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-right text-[11px] text-muted-foreground">
        <Link href="/market-values" className="hover:underline">
          See global market value rankings →
        </Link>
      </p>
    </div>
  )
}
