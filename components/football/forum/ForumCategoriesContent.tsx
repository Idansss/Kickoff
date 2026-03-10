'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  threadCount: number
  latestActivity: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const CATEGORY_ICONS: Record<string, string> = {
  general: '💬',
  transfers: '🤝',
  tactics: '🎯',
  rumours: '🔥',
  matchday: '⚽',
  fantasy: '🏆',
  international: '🌍',
}

export function ForumCategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch('/api/forums/categories')
        if (!res.ok) { setError(true); return }
        const json = (await res.json()) as { categories: Category[] }
        if (!cancelled) setCategories(json.categories)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted text-lg">
            ⚠️
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Could not load forum categories</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please try again. If this keeps happening, the forums service may be temporarily unavailable.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Link href="/forums/search" className="text-sm text-primary hover:underline">
                Search threads
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No forum categories found. Check back soon.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const icon = CATEGORY_ICONS[cat.slug] ?? '📋'
        return (
          <Link
            key={cat.id}
            href={`/forums/${cat.slug}`}
            className="group flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <div>
                <p className="font-semibold text-sm group-hover:underline">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="text-xs font-medium">{cat.threadCount} thread{cat.threadCount !== 1 ? 's' : ''}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(cat.latestActivity)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
