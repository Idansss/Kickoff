'use client'

import { useEffect, useState } from 'react'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { cn } from '@/lib/utils'

interface ClubEntry {
  rank: number
  id: string
  name: string
  badgeUrl?: string | null
  country?: string | null
  latestValueFormatted: string
  deltaFormatted?: string | null
  deltaDirection?: 'up' | 'down' | 'flat' | null
}

export function TopClubsTable() {
  const [page, setPage] = useState(1)
  const [clubs, setClubs] = useState<ClubEntry[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: '20' })
        const res = await fetch(`/api/market-values/top-clubs?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const json = (await res.json()) as {
          results: ClubEntry[]
          total: number
          totalPages: number
        }
        setClubs(json.results)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        // aborted
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void run()
    return () => controller.abort()
  }, [page])

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-xs">
          <thead className="border-b text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pl-4 pr-2 text-left">#</th>
              <th className="py-2 px-2 text-left">Club</th>
              <th className="hidden py-2 px-2 text-left sm:table-cell">Country</th>
              <th className="py-2 px-4 text-right">Squad value</th>
              <th className="hidden py-2 px-4 text-right sm:table-cell">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 pl-4 pr-2">
                      <div className="h-4 w-6 rounded bg-muted" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                    </td>
                    <td className="hidden py-3 px-2 sm:table-cell">
                      <div className="h-4 w-20 rounded bg-muted" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="ml-auto h-4 w-20 rounded bg-muted" />
                    </td>
                    <td className="hidden py-3 px-4 sm:table-cell" />
                  </tr>
                ))
              : clubs.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pl-4 pr-2 font-mono text-muted-foreground">{c.rank}</td>
                    <td className="py-2.5 px-2 font-medium">
                      <ClubIdentity
                        name={c.name}
                        badgeUrl={c.badgeUrl}
                        href={`/club/${c.id}`}
                        size="sm"
                      />
                    </td>
                    <td className="hidden py-2.5 px-2 text-muted-foreground sm:table-cell">
                      {c.country ?? '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">
                      {c.latestValueFormatted}
                    </td>
                    <td className="hidden py-2.5 px-4 text-right sm:table-cell">
                      {c.deltaFormatted ? (
                        <span
                          className={cn(
                            'font-medium',
                            c.deltaDirection === 'up' ? 'text-green-500' : '',
                            c.deltaDirection === 'down' ? 'text-red-500' : '',
                          )}
                        >
                          {c.deltaFormatted}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}

            {!loading && clubs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No clubs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} clubs</span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                'h-7 rounded-md border px-2',
                page <= 1 || loading ? 'cursor-not-allowed opacity-40' : 'hover:bg-accent',
              )}
            >
              Prev
            </button>
            <span>{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                'h-7 rounded-md border px-2',
                page >= totalPages || loading ? 'cursor-not-allowed opacity-40' : 'hover:bg-accent',
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
