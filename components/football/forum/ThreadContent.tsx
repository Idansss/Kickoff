'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useForumStore } from '@/store/forumStore'

interface Tag {
  name: string
  slug: string
}

interface ThreadDetail {
  id: string
  title: string
  isRumour: boolean
  relatedClubId: string | null
  relatedPlayerId: string | null
  category: { id: string; slug: string; name: string }
  tags: Tag[]
  totalPosts: number
  subscriberCount: number
  isSubscribed: boolean
  createdAt: string
}

interface ForumPost {
  id: string
  content: string
  authorId: string | null
  createdAt: string
  updatedAt: string
}

interface ThreadResponse {
  thread: ThreadDetail
  page: number
  pageSize: number
  totalPosts: number
  totalPages: number
  posts: ForumPost[]
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ThreadContentProps {
  threadId: string
}

export function ThreadContent({ threadId }: ThreadContentProps) {
  const [data, setData] = useState<ThreadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { isSubscribed, setSubscribed, markVisited } = useForumStore()
  const subscribed = data ? isSubscribed(threadId) : false

  const fetchThread = useCallback(async (p: number) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/forums/thread/${threadId}?page=${p}&pageSize=20`)
      if (!res.ok) { setError(true); return }
      const json = (await res.json()) as ThreadResponse
      setData(json)
      // Sync subscription state from server
      setSubscribed(threadId, json.thread.isSubscribed)
      markVisited(threadId)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [threadId, setSubscribed, markVisited])

  useEffect(() => { void fetchThread(page) }, [fetchThread, page])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    setReplyError(null)
    if (replyText.trim().length < 1) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/forums/thread/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      if (!res.ok) { setReplyError('Failed to post reply. Please try again.'); return }
      setReplyText('')
      // Re-fetch last page to see new reply
      if (data) {
        const newTotal = data.totalPosts + 1
        const lastPage = Math.ceil(newTotal / data.pageSize)
        setPage(lastPage)
        await fetchThread(lastPage)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch {
      setReplyError('Failed to post reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubscribe() {
    if (!data) return
    setSubLoading(true)
    try {
      const res = await fetch(`/api/forums/thread/${threadId}/subscribe`, { method: 'POST' })
      if (res.ok) {
        const json = (await res.json()) as { subscribed: boolean }
        setSubscribed(threadId, json.subscribed)
        setData((d) => d ? { ...d, thread: { ...d.thread, isSubscribed: json.subscribed } } : d)
      }
    } finally {
      setSubLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted" />)}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Could not load thread.
      </div>
    )
  }

  const { thread, posts, totalPages } = data

  return (
    <div className="space-y-4">
      {/* Thread header */}
      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <nav className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link href="/forums" className="hover:underline">Forums</Link>
              <span>/</span>
              <Link href={`/forums/${thread.category.slug}`} className="hover:underline">
                {thread.category.name}
              </Link>
            </nav>
            <h1 className="text-lg font-bold leading-snug">
              {thread.isRumour && (
                <span className="mr-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600">
                  RUMOUR
                </span>
              )}
              {thread.title}
            </h1>
          </div>
          <button
            onClick={() => void handleSubscribe()}
            disabled={subLoading}
            className={`h-8 shrink-0 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
              subscribed
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                : 'hover:bg-muted'
            }`}
          >
            {subLoading ? '…' : subscribed ? '🔔 Subscribed' : '🔕 Subscribe'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{thread.totalPosts} post{thread.totalPosts !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{thread.subscriberCount} subscriber{thread.subscriberCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>Started {timeAgo(thread.createdAt)}</span>
        </div>

        {thread.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {thread.tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {posts.map((post, idx) => {
          const postNumber = (page - 1) * data.pageSize + idx + 1
          return (
            <div key={post.id} className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{post.authorId ? `User #${post.authorId.slice(-4)}` : 'Anonymous'}</span>
                <div className="flex items-center gap-2">
                  <span>#{postNumber}</span>
                  <span title={formatDate(post.createdAt)}>{timeAgo(post.createdAt)}</span>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
            </div>
          )
        })}
      </div>

      <div ref={bottomRef} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-2 py-1 text-xs disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-2 py-1 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Reply form */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Reply</h3>
        {replyError && <p className="mb-2 text-xs text-red-500">{replyError}</p>}
        <form onSubmit={(e) => void handleReply(e)} className="space-y-2">
          <textarea
            rows={4}
            maxLength={10_000}
            placeholder="Write your reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{replyText.length} / 10,000</span>
            <button
              type="submit"
              disabled={submitting || replyText.trim().length < 1}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
