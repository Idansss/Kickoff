'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Tag {
  name: string
  slug: string
}

interface SearchResult {
  id: string
  title: string
  isRumour: boolean
  category: { id: string; slug: string; name: string }
  tags: Tag[]
  replyCount: number
  lastReplyAt: string
  createdAt: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ForumSearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed.length < 1) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/forums/search?q=${encodeURIComponent(trimmed)}&pageSize=30`)
      if (!res.ok) return
      const json = (await res.json()) as { results: SearchResult[]; total: number }
      setResults(json.results)
      setTotal(json.total)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/forums" className="hover:underline">Forums</Link>
          <span>/</span>
          <span>Search</span>
        </nav>
        <h1 className="text-xl font-semibold">Search threads</h1>
      </header>

      <form onSubmit={(e) => void handleSearch(e)} className="flex gap-2">
        <input
          type="search"
          placeholder="Search threads and posts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading || q.trim().length < 1}
          className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searched && !loading && (
        <p className="text-xs text-muted-foreground">
          {total === 0 ? 'No results found.' : `${total} result${total !== 1 ? 's' : ''} found`}
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-px overflow-hidden rounded-xl border bg-card">
          {results.map((thread) => (
            <Link
              key={thread.id}
              href={`/forums/thread/${thread.id}`}
              className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {thread.isRumour && (
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                      RUMOUR
                    </span>
                  )}
                  <p className="truncate text-sm font-medium">{thread.title}</p>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="rounded-full border px-1.5 py-0">{thread.category.name}</span>
                  {thread.tags.slice(0, 2).map((tag) => (
                    <span key={tag.slug}>#{tag.name}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right text-xs text-muted-foreground shrink-0">
                <span>{thread.replyCount} replies</span>
                <span className="text-[10px]">{timeAgo(thread.lastReplyAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
