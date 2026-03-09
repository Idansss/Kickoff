'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { cn } from '@/lib/utils'

interface PlayerEntry {
  rank: number
  id: string
  name: string
  nationality?: string | null
  position?: string | null
  age?: number | null
  currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
  latestValueFormatted: string
  deltaFormatted?: string | null
  deltaDirection?: 'up' | 'down' | 'flat' | null
}

interface TopPlayersTableProps {
  initialPage?: number
  pageSize?: number
  position?: string
  nationality?: string
}

export function TopPlayersTable({
  initialPage = 1,
  pageSize = 25,
  position,
  nationality,
}: TopPlayersTableProps) {
  const [page, setPage] = useState(initialPage)
  const [players, setPlayers] = useState<PlayerEntry[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
        if (position) params.set('position', position)
        if (nationality) params.set('nationality', nationality)
        const res = await fetch(`/api/market-values/top-players?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const json = (await res.json()) as {
          results: PlayerEntry[]
          total: number
          totalPages: number
        }
        setPlayers(json.results)
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
  }, [page, pageSize, position, nationality])

  return (
    <div className="space-y-2">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-xs">
          <thead className="border-b text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pl-4 pr-2 text-left">#</th>
              <th className="py-2 px-2 text-left">Player</th>
              <th className="hidden py-2 px-2 text-left sm:table-cell">Club</th>
              <th className="hidden py-2 px-2 text-left md:table-cell">Pos</th>
              <th className="hidden py-2 px-2 text-left md:table-cell">Age</th>
              <th className="py-2 px-4 text-right">Value</th>
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
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td colSpan={2} className="hidden py-3 px-2 md:table-cell" />
                    <td className="py-3 px-4">
                      <div className="ml-auto h-4 w-16 rounded bg-muted" />
                    </td>
                    <td className="hidden py-3 px-4 sm:table-cell" />
                  </tr>
                ))
              : players.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pl-4 pr-2 font-mono text-muted-foreground">{p.rank}</td>
                    <td className="py-2.5 px-2 font-medium">
                      <Link href={`/player/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                      {p.nationality && (
                        <span className="ml-1 text-[10px] text-muted-foreground">{p.nationality}</span>
                      )}
                    </td>
                    <td className="hidden py-2.5 px-2 sm:table-cell">
                      {p.currentTeam ? (
                        <ClubIdentity
                          name={p.currentTeam.name}
                          badgeUrl={p.currentTeam.badgeUrl}
                          href={`/club/${p.currentTeam.id}`}
                          size="xs"
                          textClassName="text-muted-foreground hover:underline"
                        />
                      ) : (
                        <span className="text-muted-foreground">Free agent</span>
                      )}
                    </td>
                    <td className="hidden py-2.5 px-2 text-muted-foreground md:table-cell">
                      {p.position ?? '—'}
                    </td>
                    <td className="hidden py-2.5 px-2 text-muted-foreground md:table-cell">
                      {p.age ?? '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">
                      {p.latestValueFormatted}
                    </td>
                    <td className="hidden py-2.5 px-4 text-right sm:table-cell">
                      {p.deltaFormatted ? (
                        <span
                          className={cn(
                            'font-medium',
                            p.deltaDirection === 'up' ? 'text-green-500' : '',
                            p.deltaDirection === 'down' ? 'text-red-500' : '',
                          )}
                        >
                          {p.deltaFormatted}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}

            {!loading && players.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No players found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} players</span>
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
            <span>
              {page} / {totalPages}
            </span>
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
