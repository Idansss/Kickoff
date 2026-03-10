'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

const FiltersSchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  sort: z.enum(['clients_desc', 'value_desc', 'name_asc']).optional(),
})

type FiltersState = z.infer<typeof FiltersSchema>

interface AgentResult {
  id: string
  name: string
  country?: string | null
  email?: string | null
  agencies: Array<{ id: string; name: string; role?: string | null }>
  clientCount: number
  totalClientValueFormatted?: string | null
}

export function AgentsContent() {
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
  const [results, setResults] = useState<AgentResult[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(`/agents${qs ? `?${qs}` : ''}`)
  }, [filters, page, router])

  // Fetch results
  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
        params.set('page', String(page))
        const res = await fetch(`/api/agents?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) return
        const json = (await res.json()) as {
          results: AgentResult[]
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

  const handleValueChange = (field: keyof FiltersState) => (value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
  }

  const hasActive = useMemo(
    () => Object.values(filters).some((v) => v != null && v !== ''),
    [filters],
  )

  const loadingRows = useMemo(() => Array.from({ length: 10 }), [])

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Sidebar filters */}
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
              htmlFor="agents-search"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Name
            </label>
            <input
              id="agents-search"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Search agents…"
              value={filters.search ?? ''}
              onChange={handleChange('search')}
            />
          </div>

          <div>
            <label
              htmlFor="agents-country"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Country
            </label>
            <input
              id="agents-country"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Italy, England…"
              value={filters.country ?? ''}
              onChange={handleChange('country')}
            />
          </div>

          <div>
            <label
              htmlFor="agents-sort"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Sort by
            </label>
            <Select value={filters.sort ?? 'clients_desc'} onValueChange={handleValueChange('sort')}>
              <SelectTrigger className="mt-1 h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clients_desc">Most clients</SelectItem>
                <SelectItem value="value_desc">Highest portfolio value</SelectItem>
                <SelectItem value="name_asc">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </div>
      </aside>

      {/* Results */}
      <section className="flex-1 space-y-3">
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('inline-block h-2 w-2 rounded-full', loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500')} />
            <span>
              {loading
                ? 'Loading agents…'
                : total > 0
                ? `${total} agent${total === 1 ? '' : 's'} found`
                : 'No agents found'}
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
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-44 rounded bg-muted animate-pulse" />
                      <div className="mt-2 h-3 w-28 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))
            : results.map((a, rank) => {
                const index = (page - 1) * 20 + rank + 1
                const initials = a.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={a.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/agents/${a.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') router.push(`/agents/${a.id}`)
                    }}
                    className="group cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-bold text-muted-foreground">
                          {initials}
                          <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[10px] font-bold text-muted-foreground">
                            {index}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold group-hover:underline">{a.name}</p>
                            {a.country ? <Badge variant="secondary">{a.country}</Badge> : null}
                          </div>
                          {a.agencies.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                              {a.agencies.slice(0, 2).map((ag) => (
                                <Link
                                  key={ag.id}
                                  href={`/agencies/${ag.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                  className="hover:underline"
                                >
                                  {ag.name}
                                  {ag.role ? ` (${ag.role})` : ''}
                                </Link>
                              ))}
                              {a.agencies.length > 2 ? <span>+{a.agencies.length - 2} more</span> : null}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">Independent</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {a.totalClientValueFormatted ?? <span className="text-muted-foreground">—</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {a.clientCount} client{a.clientCount !== 1 ? 's' : ''}
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
            <p className="text-sm font-semibold">No agents match your filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try removing the country filter or using fewer keywords.</p>
          </div>
        )}
      </section>
    </div>
  )
}
