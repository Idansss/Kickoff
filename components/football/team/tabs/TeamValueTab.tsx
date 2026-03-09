'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ValueHistoryChart } from '@/components/football/market-value/ValueHistoryChart'

interface HistoryPoint {
  date: string
  valueEur: number
  formatted: string
}

interface ClubHistoryResponse {
  teamId: string
  teamName: string
  history: HistoryPoint[]
  summary: {
    latest: { value: string; date: string } | null
    earliest: { value: string; date: string } | null
    allTimeHigh: { value: string; date: string } | null
    totalChange: { deltaEur: number; formatted: string } | null
  }
}

interface TeamValueTabProps {
  teamId: string
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col rounded-lg border bg-card px-4 py-3 text-center">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="mt-0.5 text-lg font-bold">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  )
}

export function TeamValueTab({ teamId }: TeamValueTabProps) {
  const [data, setData] = useState<ClubHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/market-values/club-history/${teamId}`)
        if (!res.ok) { setError(true); return }
        if (!cancelled) setData((await res.json()) as ClubHistoryResponse)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [teamId])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-xl border bg-muted" />
      </div>
    )
  }

  if (error || !data || data.history.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        Squad valuation data is not available for this club yet.
      </div>
    )
  }

  const { history, summary } = data
  const isPositive = (summary.totalChange?.deltaEur ?? 0) >= 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.latest && (
          <SummaryCard
            label="Current squad value"
            value={summary.latest.value}
            sub={new Date(summary.latest.date).toLocaleDateString('en-GB', {
              month: 'short',
              year: 'numeric',
            })}
          />
        )}
        {summary.allTimeHigh && (
          <SummaryCard
            label="Peak squad value"
            value={summary.allTimeHigh.value}
            sub={new Date(summary.allTimeHigh.date).toLocaleDateString('en-GB', {
              month: 'short',
              year: 'numeric',
            })}
          />
        )}
        {summary.earliest && (
          <SummaryCard
            label="Earliest recorded"
            value={summary.earliest.value}
            sub={new Date(summary.earliest.date).toLocaleDateString('en-GB', {
              month: 'short',
              year: 'numeric',
            })}
          />
        )}
        {summary.totalChange && (
          <SummaryCard
            label="Total change"
            value={summary.totalChange.formatted}
            sub={isPositive ? 'appreciation' : 'depreciation'}
          />
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Squad value history
        </h3>
        <ValueHistoryChart history={history} color={isPositive ? '#22c55e' : '#ef4444'} />
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Value snapshots
            </h3>
          </div>
          <div className="divide-y">
            {[...history].reverse().map((h, i, arr) => {
              const prev = arr[i + 1]
              const delta = prev ? h.valueEur - prev.valueEur : null
              return (
                <div key={h.date} className="flex items-center justify-between px-4 py-2 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(h.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    {delta != null && (
                      <span
                        className={
                          delta > 0
                            ? 'text-green-500'
                            : delta < 0
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                        }
                      >
                        {delta >= 0 ? '+' : ''}€{(Math.abs(delta) / 1_000_000).toFixed(0)}m
                      </span>
                    )}
                    <span className="font-semibold">{h.formatted}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="text-right text-[11px] text-muted-foreground">
        <Link href="/market-values?tab=clubs" className="hover:underline">
          See all club value rankings →
        </Link>
      </div>
    </div>
  )
}
