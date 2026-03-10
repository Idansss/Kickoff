'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

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

  const handleValueChange = (field: keyof FiltersState) => (value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
  }

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v != null && v !== ''),
    [filters],
  )

  const loadingRows = useMemo(() => Array.from({ length: 8 }), [])

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="w-full lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border bg-card p-3 text-sm">
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
            <label
              htmlFor="ce-position"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Position
            </label>
            <Select value={filters.position ?? ''} onValueChange={handleValueChange('position')}>
              <SelectTrigger className="mt-1 h-8 w-full text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="GK">Goalkeepers</SelectItem>
                <SelectItem value="DF">Defenders</SelectItem>
                <SelectItem value="MF">Midfielders</SelectItem>
                <SelectItem value="FW">Forwards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="ce-end-from"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                End from
              </label>
              <input
                id="ce-end-from"
                type="date"
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.endFrom ?? ''}
                onChange={handleInputChange('endFrom')}
              />
            </div>
            <div>
              <label
                htmlFor="ce-end-to"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                End to
              </label>
              <input
                id="ce-end-to"
                type="date"
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.endTo ?? ''}
                onChange={handleInputChange('endTo')}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="ce-sort"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Sort by
            </label>
            <Select value={filters.sort ?? 'end_asc'} onValueChange={handleValueChange('sort')}>
              <SelectTrigger className="mt-1 h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="end_asc">Soonest expiry</SelectItem>
                <SelectItem value="value_desc">Market value (desc)</SelectItem>
                <SelectItem value="name_asc">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
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
                ? 'Loading expiring contracts…'
                : total > 0
                ? `${total} contract${total === 1 ? '' : 's'} ending in this window`
                : 'No contracts found in this window'}
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
                      <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                      <div className="mt-2 h-3 w-28 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))
            : results.map((p) => {
                const initials = p.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                const endLabel = new Date(p.contract.endDate).toLocaleDateString('en-GB', {
                  month: 'short',
                  year: 'numeric',
                })

                return (
                  <Link
                    key={p.contract.id}
                    href={`/player/${p.id}`}
                    className="group rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-bold text-muted-foreground">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold group-hover:underline">{p.name}</p>
                            {p.position ? <Badge variant="secondary">{p.position}</Badge> : null}
                            <Badge variant="outline">Ends {endLabel}</Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {p.nationality ? <span>{p.nationality}</span> : null}
                            {p.age != null ? <span>{p.age} yrs</span> : null}
                            {p.club ? (
                              <ClubIdentity
                                name={p.club.name}
                                badgeUrl={p.club.badgeUrl}
                                href={`/club/${p.club.id}`}
                                size="xs"
                                textClassName="text-xs text-muted-foreground group-hover:underline"
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {p.marketValue?.formatted ?? <span className="text-muted-foreground">—</span>}
                        </p>
                        {p.marketValue?.date ? (
                          <p className="text-[11px] text-muted-foreground">
                            Updated {new Date(p.marketValue.date).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No recent value</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
        </div>

        {!loading && results.length === 0 && (
          <div className="rounded-xl border bg-card p-10 text-center">
            <div className="mx-auto mb-2 w-fit rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
              No results
            </div>
            <p className="text-sm font-semibold">No contracts in this window</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Expand the expiry window or remove position filters.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

