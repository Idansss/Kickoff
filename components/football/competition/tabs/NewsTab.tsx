"use client"

import { useEffect, useState } from 'react'
import { NewsCardList } from '@/components/news/NewsCardList'

interface NewsItem {
  id: string
  title: string
  summary?: string
  source?: string
  url?: string
  imageUrl?: string
  publishedAt: string
  teamId?: string
  competitionId?: string
}

interface Props {
  competitionId: string
}

export function NewsTab({ competitionId }: Props) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/news?scope=latest&competitionId=${encodeURIComponent(competitionId)}`,
        )
        if (!res.ok) throw new Error('Failed to load news')
        const json = (await res.json()) as { items: NewsItem[] }
        if (!cancelled) setItems(json.items ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load competition news.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [competitionId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">News</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading news…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-muted-foreground">No news yet for this competition.</p>
      )}
      {items.length > 0 && <NewsCardList items={items} />}
    </section>
  )
}

