'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { ClubIdentity } from '@/components/common/ClubIdentity'

const FiltersSchema = z.object({
  competitionId: z.string().optional(),
  clubId: z.string().optional(),
  position: z.string().optional(),
  endFrom: z.string().optional(),
  endTo: z.string().optional(),
  sort: z.enum(['end_asc', 'value_desc', 'name_asc']).optional(),
})

type FiltersState = z.infer<typeof FiltersSchema>

interface ContractEndingResult {
  id: string
  name: string
  nationality?: string | null
  position?: string | null
  age?: number | null
  currentTeam?: {
    id: string
    name: string
    badgeUrl?: string | null
  } | null
  club?: {
    id: string
    name: string
    badgeUrl?: string | null
  } | null
  contract: {
    id: string
    endDate: string
    status: string
  }
  marketValue?: {
    raw: number
    formatted: string
    date: string
  } | null
}

function defaultEndTo(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export function ContractsEndingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<FiltersState>(() => {
    const initial: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      initial[key] = value
    })
    const parsed = FiltersSchema.safeParse(initial)
    // default: show contracts ending within 12 months
    return parsed.success
      ? { endTo: defaultEndTo(), ...parsed.data }
      : { endTo: defaultEndTo() }
  })

  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    const n = p ? Number(p) : 1
    return Number.isFinite(n) && n > 0 ? n : 1
  })

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ContractEndingResult[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    router.replace(`/contracts-ending${query ? `?${query}` : ''}`)
  }, [filters, page, router])

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value)
        })
        params.set('page', String(page))
        const res = await fetch(`/api/players/contracts-ending?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const json = (await res.json()) as {
          results: ContractEndingResult[]
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

  const handleInputChange =
    (field: keyof FiltersState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value || undefined
      setPage(1)
      setFilters((prev) => ({ ...prev, [field]: value }))
    }

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v != null && v !== ''),
    [filters],
  )

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="w-full max-w-xs rounded-lg border bg-card p-3 text-sm lg:sticky lg:top-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilters({})
                setPage(1)
              }}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Quick window presets */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Expiry window
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { label: '3 months', months: 3 },
                { label: '6 months', months: 6 },
                { label: '12 months', months: 12 },
                { label: '24 months', months: 24 },
              ].map(({ label, months }) => {
                const end = new Date()
                end.setMonth(end.getMonth() + months)
                const endStr = end.toISOString().split('T')[0]
                const active = filters.endTo === endStr
                return (
                  <button
                    key={months}
                    type="button"
                    onClick={() => {
                      setPage(1)
                      setFilters((prev) => ({ ...prev, endFrom: undefined, endTo: endStr }))
                    }}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                      active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Position
            </label>
            <select
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={filters.position ?? ''}
              onChange={handleInputChange('position')}
            >
              <option value="">Any</option>
              <option value="GK">Goalkeepers</option>
              <option value="DF">Defenders</option>
              <option value="MF">Midfielders</option>
              <option value="FW">Forwards</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                End from
              </label>
              <input
                type="date"
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.endFrom ?? ''}
                onChange={handleInputChange('endFrom')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                End to
              </label>
              <input
                type="date"
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.endTo ?? ''}
                onChange={handleInputChange('endTo')}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </label>
            <select
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={filters.sort ?? 'end_asc'}
              onChange={handleInputChange('sort')}
            >
              <option value="end_asc">Soonest expiry</option>
              <option value="value_desc">Market value (desc)</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
          </div>
        </div>
      </aside>

      <section className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {loading
              ? 'Loading expiring contracts…'
              : total > 0
              ? `${total} contract${total === 1 ? '' : 's'} ending in this window`
              : 'No contracts found in this window'}
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
          {results.map((p) => (
            <div key={p.contract.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <a href={`/player/${p.id}`} className="truncate text-sm font-medium hover:underline">
                    {p.name}
                  </a>
                  {p.position && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {p.position}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                  {p.nationality && <span>{p.nationality}</span>}
                  {p.age != null && <span>{p.age} yrs</span>}
                  {p.club && (
                    <ClubIdentity
                      name={p.club.name}
                      badgeUrl={p.club.badgeUrl}
                      href={`/club/${p.club.id}`}
                      size="xs"
                      textClassName="hover:underline"
                    />
                  )}
                  <span>Ends {new Date(p.contract.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold">
                  {p.marketValue?.formatted ?? <span className="text-muted-foreground">—</span>}
                </div>
                {p.marketValue?.date && (
                  <div className="text-[10px] text-muted-foreground">
                    Last value {new Date(p.marketValue.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Try expanding the date window or removing filters.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

