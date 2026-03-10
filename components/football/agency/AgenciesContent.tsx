'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const FiltersSchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  sort: z.enum(['clients_desc', 'value_desc', 'agents_desc', 'name_asc']).optional(),
})

type FiltersState = z.infer<typeof FiltersSchema>

interface AgencyResult {
  id: string
  name: string
  country?: string | null
  website?: string | null
  agentCount: number
  agents: Array<{ id: string; name: string; role?: string | null }>
  clientCount: number
  totalClientValueFormatted?: string | null
}

export function AgenciesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<FiltersState>(() => {
    const initial: Record<string, string> = {}
    searchParams.forEach((value, key) => { initial[key] = value })
    const parsed = FiltersSchema.safeParse(initial)
    return parsed.success ? parsed.data : {}
  })

  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    const n = p ? Number(p) : 1
    return Number.isFinite(n) && n > 0 ? n : 1
  })

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AgencyResult[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(`/agencies${qs ? `?${qs}` : ''}`)
  }, [filters, page, router])

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
        params.set('page', String(page))
        const res = await fetch(`/api/agencies?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) return
        const json = (await res.json()) as {
          results: AgencyResult[]
          total: number
          totalPages: number
        }
        setResults(json.results)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
          setTotal(0)
          setTotalPages(1)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void run()
    return () => controller.abort()
  }, [filters, page])

  const handleChange =
    (field: keyof FiltersState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value || undefined
      setPage(1)
      setFilters((prev) => ({ ...prev, [field]: value }))
    }

  const hasActive = useMemo(
    () => Object.values(filters).some((v) => v != null && v !== ''),
    [filters],
  )

  const loadingRows = useMemo(() => Array.from({ length: 10 }), [])

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="w-full lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border bg-card p-3 text-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filters
            </h2>
            {hasActive && (
              <button
                type="button"
                onClick={() => { setFilters({}); setPage(1) }}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-3">
          <div>
            <label
              htmlFor="agencies-search"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Agency name
            </label>
            <input
              id="agencies-search"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Search agencies…"
              value={filters.search ?? ''}
              onChange={handleChange('search')}
            />
          </div>

          <div>
            <label
              htmlFor="agencies-country"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Country
            </label>
            <input
              id="agencies-country"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Spain, Brazil…"
              value={filters.country ?? ''}
              onChange={handleChange('country')}
            />
          </div>

          <div>
            <label
              htmlFor="agencies-sort"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Sort by
            </label>
            <select
              id="agencies-sort"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={filters.sort ?? 'value_desc'}
              onChange={handleChange('sort')}
            >
              <option value="value_desc">Highest portfolio value</option>
              <option value="clients_desc">Most clients</option>
              <option value="agents_desc">Most agents</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
          </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 space-y-3">
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('inline-block h-2 w-2 rounded-full', loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500')} />
            <span>
              {loading
                ? 'Loading agencies…'
                : total > 0
                ? `${total} agenc${total === 1 ? 'y' : 'ies'} found`
                : 'No agencies found'}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cn(
                  'h-8 rounded-md border px-2.5 transition-colors',
                  page <= 1 || loading ? 'cursor-not-allowed opacity-40' : 'hover:bg-accent',
                )}
              >
                Prev
              </button>
              <span className="px-1">
                Page <span className="font-medium text-foreground">{page}</span> / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={cn(
                  'h-8 rounded-md border px-2.5 transition-colors',
                  page >= totalPages || loading ? 'cursor-not-allowed opacity-40' : 'hover:bg-accent',
                )}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {loading
            ? loadingRows.map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                      <div className="mt-2 h-3 w-32 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))
            : results.map((ag, rank) => {
                const index = (page - 1) * 20 + rank + 1
                const initials = ag.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={ag.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/agencies/${ag.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') router.push(`/agencies/${ag.id}`)
                    }}
                    className="group cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted text-xs font-bold text-muted-foreground">
                          {initials}
                          <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[10px] font-bold text-muted-foreground">
                            {index}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold group-hover:underline">{ag.name}</p>
                            {ag.country ? <Badge variant="secondary">{ag.country}</Badge> : null}
                          </div>

                          {ag.agents.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                              {ag.agents.slice(0, 2).map((agent) => (
                                <Link
                                  key={agent.id}
                                  href={`/agents/${agent.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline"
                                >
                                  {agent.name}
                                  {agent.role ? ` (${agent.role})` : ''}
                                </Link>
                              ))}
                              {ag.agents.length > 2 ? <span>+{ag.agents.length - 2} more</span> : null}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">No agents listed</p>
                          )}

                          {ag.website ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              <a
                                href={ag.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline"
                              >
                                {ag.website.replace(/^https?:\/\//, '')}
                              </a>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {ag.totalClientValueFormatted ?? <span className="text-muted-foreground">—</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {ag.clientCount} client{ag.clientCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {ag.agentCount} agent{ag.agentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>

        {!loading && results.length === 0 && (
          <div className="rounded-xl border bg-card p-10 text-center">
            <div className="mx-auto mb-2 w-fit rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
              No results
            </div>
            <p className="text-sm font-semibold">No agencies match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try removing the country filter or using fewer keywords.</p>
          </div>
        )}
      </section>
    </div>
  )
}
