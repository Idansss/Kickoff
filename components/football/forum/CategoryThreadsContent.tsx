'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Tag {
  name: string
  slug: string
}

interface ThreadSummary {
  id: string
  title: string
  isRumour: boolean
  replyCount: number
  tags: Tag[]
  createdAt: string
  lastReplyAt: string
}

interface CategoryInfo {
  id: string
  slug: string
  name: string
  description: string | null
}

interface ThreadsResponse {
  category: CategoryInfo
  page: number
  pageSize: number
  total: number
  totalPages: number
  results: ThreadSummary[]
}

interface NewThreadForm {
  title: string
  body: string
  isRumour: boolean
  tags: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest activity' },
  { value: 'replies', label: 'Most replies' },
  { value: 'oldest', label: 'Oldest first' },
] as const

interface CategoryThreadsContentProps {
  categorySlug: string
}

export function CategoryThreadsContent({ categorySlug }: CategoryThreadsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<ThreadsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<NewThreadForm>({ title: '', body: '', isRumour: false, tags: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const page = Number(searchParams.get('page') ?? '1')
  const sort = (searchParams.get('sort') ?? 'latest') as 'latest' | 'replies' | 'oldest'
  const search = searchParams.get('search') ?? ''

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const qs = new URLSearchParams({ page: String(page), sort })
      if (search) qs.set('search', search)
      const res = await fetch(`/api/forums/${categorySlug}?${qs}`)
      if (!res.ok) { setError(true); return }
      setData((await res.json()) as ThreadsResponse)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [categorySlug, page, sort, search])

  useEffect(() => { void fetchThreads() }, [fetchThreads])

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key !== 'page') params.set('page', '1')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (form.title.trim().length < 3) { setFormError('Title must be at least 3 characters.'); return }
    if (form.body.trim().length < 10) { setFormError('Body must be at least 10 characters.'); return }
    setSubmitting(true)
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const res = await fetch(`/api/forums/${categorySlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), body: form.body.trim(), isRumour: form.isRumour, tags }),
      })
      if (!res.ok) { setFormError('Failed to create thread. Please try again.'); return }
      const json = (await res.json()) as { thread: { id: string } }
      setShowForm(false)
      setForm({ title: '', body: '', isRumour: false, tags: '' })
      router.push(`/forums/thread/${json.thread.id}`)
    } catch {
      setFormError('Failed to create thread. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search threads…"
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="h-8 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="h-8 rounded-lg border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          + New thread
        </button>
      </div>

      {/* New thread form */}
      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">Start a new thread</h3>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <input
            type="text"
            placeholder="Thread title (min 3 chars)"
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <textarea
            placeholder="Write your post… (min 10 chars)"
            rows={4}
            maxLength={10_000}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated, optional)"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.isRumour}
              onChange={(e) => setForm((f) => ({ ...f, isRumour: e.target.checked }))}
              className="accent-primary"
            />
            Mark as rumour
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post thread'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="rounded-lg border px-4 py-1.5 text-xs hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Could not load threads.
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No threads yet in this category. Be the first to post!
        </div>
      ) : (
        <>
          <div className="space-y-px overflow-hidden rounded-xl border bg-card">
            {data.results.map((thread) => (
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
                  {thread.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {thread.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.slug}
                          className="rounded-full border px-1.5 py-0 text-[10px] text-muted-foreground"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right text-xs text-muted-foreground shrink-0">
                  <span>{thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}</span>
                  <span className="text-[10px]">{timeAgo(thread.lastReplyAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="rounded border px-2 py-1 text-xs disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="rounded border px-2 py-1 text-xs disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
