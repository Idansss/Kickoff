'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'

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

  const hasActive = useMemo(
    () => Object.values(filters).some((v) => v != null && v !== ''),
    [filters],
  )

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Sidebar filters */}
      <aside className="w-full max-w-xs rounded-lg border bg-card p-3 text-sm lg:sticky lg:top-4 lg:self-start">
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
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <input
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Search agents…"
              value={filters.search ?? ''}
              onChange={handleChange('search')}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Country
            </label>
            <input
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Italy, England…"
              value={filters.country ?? ''}
              onChange={handleChange('country')}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </label>
            <select
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={filters.sort ?? 'clients_desc'}
              onChange={handleChange('sort')}
            >
              <option value="clients_desc">Most clients</option>
              <option value="value_desc">Highest portfolio value</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Results */}
      <section className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {loading
              ? 'Loading agents…'
              : total > 0
              ? `${total} agent${total === 1 ? '' : 's'} found`
              : 'No agents found'}
          </span>

          {totalPages > 1 && (
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
                Page {page} / {totalPages}
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
          )}
        </div>

        <div className="divide-y rounded-lg border bg-card">
          {results.map((a, rank) => (
            <div key={a.id} className="flex items-center gap-3 px-3 py-3">
              {/* Rank badge */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                {(page - 1) * 20 + rank + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`/agents/${a.id}`}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {a.name}
                  </a>
                  {a.country && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {a.country}
                    </span>
                  )}
                </div>

                {a.agencies.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-x-1 text-[11px] text-muted-foreground">
                    {a.agencies.map((ag) => (
                      <a
                        key={ag.id}
                        href={`/agencies/${ag.id}`}
                        className="hover:underline"
                      >
                        {ag.name}
                        {ag.role ? ` (${ag.role})` : ''}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right text-xs">
                <div className="font-semibold">
                  {a.totalClientValueFormatted ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {a.clientCount} client{a.clientCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}

          {!loading && results.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              No agents match your filters.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
