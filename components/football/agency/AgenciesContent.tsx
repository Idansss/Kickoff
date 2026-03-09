'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'

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

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
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
              Agency name
            </label>
            <input
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="Search agencies…"
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
              placeholder="Spain, Brazil…"
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
      </aside>

      <section className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {loading
              ? 'Loading agencies…'
              : total > 0
              ? `${total} agenc${total === 1 ? 'y' : 'ies'} found`
              : 'No agencies found'}
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
          {results.map((ag, rank) => (
            <div key={ag.id} className="flex items-start gap-3 px-3 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                {(page - 1) * 20 + rank + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`/agencies/${ag.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {ag.name}
                  </a>
                  {ag.country && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {ag.country}
                    </span>
                  )}
                </div>

                {ag.agents.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                    {ag.agents.slice(0, 4).map((agent) => (
                      <a
                        key={agent.id}
                        href={`/agents/${agent.id}`}
                        className="hover:underline"
                      >
                        {agent.name}
                        {agent.role ? ` (${agent.role})` : ''}
                      </a>
                    ))}
                    {ag.agents.length > 4 && (
                      <span>+{ag.agents.length - 4} more</span>
                    )}
                  </div>
                )}

                {ag.website && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    <a
                      href={ag.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {ag.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right text-xs">
                <div className="font-semibold">
                  {ag.totalClientValueFormatted ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {ag.clientCount} client{ag.clientCount !== 1 ? 's' : ''}
                </div>
                <div className="text-muted-foreground">
                  {ag.agentCount} agent{ag.agentCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}

          {!loading && results.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              No agencies match your filters.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
