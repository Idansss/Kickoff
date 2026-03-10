'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { ClubIdentity } from '@/components/common/ClubIdentity'

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
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Nationality
            </label>
            <input
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              placeholder="England, Brazil…"
              value={filters.nationality ?? ''}
              onChange={handleInputChange('nationality')}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Age min
              </label>
              <input
                type="number"
                min={16}
                max={45}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.ageMin ?? ''}
                onChange={handleInputChange('ageMin')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Age max
              </label>
              <input
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
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Value min (€m)
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.valueMin ?? ''}
                onChange={handleInputChange('valueMin')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Value max (€m)
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={filters.valueMax ?? ''}
                onChange={handleInputChange('valueMax')}
              />
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

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Preferred foot
            </label>
            <select
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={filters.preferredFoot ?? ''}
              onChange={handleInputChange('preferredFoot')}
            >
              <option value="">Any</option>
              <option value="Right">Right</option>
              <option value="Left">Left</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </label>
            <select
              className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={filters.sort ?? 'value_desc'}
              onChange={handleInputChange('sort')}
            >
              <option value="value_desc">Market value (desc)</option>
              <option value="age_asc">Youngest first</option>
              <option value="age_desc">Oldest first</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
          </div>
        </div>
      </aside>

      <section className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {loading
              ? 'Searching players…'
              : total > 0
              ? `${total} player${total === 1 ? '' : 's'} found`
              : 'No players found'}
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
            <a
              key={p.id}
              href={`/player/${p.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  {p.position && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {p.position}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                  {p.nationality && <span>{p.nationality}</span>}
                  {p.age != null && <span>{p.age} yrs</span>}
                  {p.heightCm != null && <span>{p.heightCm} cm</span>}
                  {p.preferredFoot && <span>{p.preferredFoot} foot</span>}
                  {p.currentTeam && (
                    <ClubIdentity
                      name={p.currentTeam.name}
                      badgeUrl={p.currentTeam.badgeUrl}
                      size="xs"
                    />
                  )}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold">
                  {p.marketValue?.formatted ?? <span className="text-muted-foreground">—</span>}
                </div>
                {p.marketValue?.date && (
                  <div className="text-[10px] text-muted-foreground">
                    Updated {new Date(p.marketValue.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </a>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Try relaxing your filters to see more players.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

