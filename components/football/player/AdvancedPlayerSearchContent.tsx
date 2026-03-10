'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const FiltersSchema = z.object({
  nationality: z.string().optional(),
  birthCountry: z.string().optional(),
  preferredFoot: z.string().optional(),
  position: z.string().optional(),
  ageMin: z.string().optional(),
  ageMax: z.string().optional(),
  valueMin: z.string().optional(),
  valueMax: z.string().optional(),
  sort: z.enum(['value_desc', 'age_asc', 'age_desc', 'name_asc']).optional(),
})

type FiltersState = z.infer<typeof FiltersSchema>

interface PlayerResult {
  id: string
  name: string
  nationality?: string | null
  birthCountry?: string | null
  position?: string | null
  preferredFoot?: string | null
  heightCm?: number | null
  age?: number | null
  currentTeam?: {
    id: string
    name: string
    badgeUrl?: string | null
  } | null
  marketValue?: {
    raw: number
    formatted: string
    date: string
  } | null
}

export function AdvancedPlayerSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<FiltersState>(() => {
    const initial: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      initial[key] = value
    })
    const parsed = FiltersSchema.safeParse(initial)
    return parsed.success ? parsed.data : {}
  })

  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    const n = p ? Number(p) : 1
    return Number.isFinite(n) && n > 0 ? n : 1
  })

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PlayerResult[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    router.replace(`/players/advanced-search${query ? `?${query}` : ''}`)
  }, [filters, page, router])

  // Fetch results whenever filters/page change
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
        const res = await fetch(`/api/search/players/advanced?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const json = (await res.json()) as {
          results: PlayerResult[]
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

  const handleInputChange = (field: keyof FiltersState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value || undefined
    setPage(1)
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleValueChange = (field: keyof FiltersState) => (value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [field]: value === 'all' ? undefined : value || undefined }))
  }

  const hasActiveFilters = useMemo(
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
          <div>
            <label
              htmlFor="aps-nationality"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Nationality
            </label>
            <input
              id="aps-nationality"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="England, Brazil…"
              value={filters.nationality ?? ''}
              onChange={handleInputChange('nationality')}
            />
          </div>

          <div>
            <label
              htmlFor="aps-birth-country"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Birth country
            </label>
            <input
              id="aps-birth-country"
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="France, Argentina…"
              value={filters.birthCountry ?? ''}
              onChange={handleInputChange('birthCountry')}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="aps-age-min"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Age min
              </label>
              <input
                id="aps-age-min"
                type="number"
                min={16}
                max={45}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.ageMin ?? ''}
                onChange={handleInputChange('ageMin')}
              />
            </div>
            <div>
              <label
                htmlFor="aps-age-max"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Age max
              </label>
              <input
                id="aps-age-max"
                type="number"
                min={16}
                max={45}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.ageMax ?? ''}
                onChange={handleInputChange('ageMax')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="aps-value-min"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Value min (€m)
              </label>
              <input
                id="aps-value-min"
                type="number"
                min={0}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.valueMin ?? ''}
                onChange={handleInputChange('valueMin')}
              />
            </div>
            <div>
              <label
                htmlFor="aps-value-max"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Value max (€m)
              </label>
              <input
                id="aps-value-max"
                type="number"
                min={0}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.valueMax ?? ''}
                onChange={handleInputChange('valueMax')}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="aps-position"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Position
            </label>
            <Select value={filters.position ?? 'all'} onValueChange={handleValueChange('position')}>
              <SelectTrigger className="mt-1 h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="GK">Goalkeepers</SelectItem>
                <SelectItem value="DF">Defenders</SelectItem>
                <SelectItem value="MF">Midfielders</SelectItem>
                <SelectItem value="FW">Forwards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="aps-foot"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Preferred foot
            </label>
            <Select value={filters.preferredFoot ?? 'all'} onValueChange={handleValueChange('preferredFoot')}>
              <SelectTrigger className="mt-1 h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="Right">Right</SelectItem>
                <SelectItem value="Left">Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="aps-sort"
              className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Sort by
            </label>
            <Select value={filters.sort ?? 'value_desc'} onValueChange={handleValueChange('sort')}>
              <SelectTrigger className="mt-1 h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value_desc">Market value (desc)</SelectItem>
                <SelectItem value="age_asc">Youngest first</SelectItem>
                <SelectItem value="age_desc">Oldest first</SelectItem>
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
                ? 'Searching players…'
                : total > 0
                ? `${total} player${total === 1 ? '' : 's'} found`
                : 'No players found'}
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
                      <div className="mt-2 h-3 w-32 rounded bg-muted animate-pulse" />
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

                return (
                  <Link
                    key={p.id}
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
                            {p.preferredFoot ? <Badge variant="outline">{p.preferredFoot} foot</Badge> : null}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {p.nationality ? <span>{p.nationality}</span> : null}
                            {p.age != null ? <span>{p.age} yrs</span> : null}
                            {p.heightCm != null ? <span>{p.heightCm} cm</span> : null}
                            {p.currentTeam ? (
                              <ClubIdentity
                                name={p.currentTeam.name}
                                badgeUrl={p.currentTeam.badgeUrl}
                                href={`/club/${p.currentTeam.id}`}
                                size="xs"
                                textClassName="text-xs text-muted-foreground group-hover:underline"
                              />
                            ) : (
                              <span>Free agent</span>
                            )}
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
            <p className="text-sm font-semibold">Try relaxing your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Remove constraints or broaden the age/value ranges to see more players.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

