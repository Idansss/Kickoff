"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TeamNewsItem {
  id: string
  title: string
  source?: string | null
  url?: string | null
  imageUrl?: string | null
  publishedAt: string
}

interface Props {
  teamId: string
}

export function TeamNewsTab({ teamId }: Props) {
  const [items, setItems] = useState<TeamNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/teams/${teamId}/news`)
        if (!res.ok) throw new Error('Failed to load news')
        const json = (await res.json()) as { news: TeamNewsItem[] }
        if (!cancelled) setItems(json.news ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load team news.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [teamId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">News</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading news…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-muted-foreground">No news yet for this team.</p>
      )}
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border bg-background px-3 py-2">
            {item.url ? (
              <Link href={item.url} className="font-medium hover:underline" target="_blank" rel="noreferrer">
                {item.title}
              </Link>
            ) : (
              <p className="font-medium">{item.title}</p>
            )}
            <div className="mt-1 text-[11px] text-muted-foreground">
              {item.source && <span>{item.source}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

