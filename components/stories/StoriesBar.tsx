'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { userStore } from '@/store/userStore'

interface Story {
  id: string
  content: string
  image?: string | null
  createdAt: string
  author: {
    id: string
    name: string
    handle: string
    avatar: string
  }
}

const MOCK_STORIES: Story[] = [
  { id: 's1', content: '⚽ Haaland hat-trick incoming tonight, calling it!', createdAt: new Date(Date.now() - 3600000).toISOString(), author: { id: 'u2', name: 'Fabrizio Romano', handle: 'fabrizioromano', avatar: 'FR' } },
  { id: 's2', content: '🔴 Liverpool training looks sharp. Title race ON!', createdAt: new Date(Date.now() - 7200000).toISOString(), author: { id: 'u3', name: 'OptaJoe', handle: 'OptaJoe', avatar: 'OJ' } },
  { id: 's3', content: '📊 Stats don\'t lie: Arsenal have the best defence this season', createdAt: new Date(Date.now() - 10800000).toISOString(), author: { id: 'u4', name: 'TheAthletic', handle: 'TheAthletic', avatar: 'TA' } },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (h > 0) return `${h}h`
  return `${m}m`
}

function expiresIn(dateStr: string): string {
  const remaining = 24 * 3600000 - (Date.now() - new Date(dateStr).getTime())
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  if (h > 0) return `${h}h left`
  return `${m}m left`
}

export function StoriesBar() {
  const currentUser = userStore((s) => s.currentUser)
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [viewed, setViewed] = useState<Set<string>>(new Set())
  const progressRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetch('/api/stories')
      .then((r) => r.json())
      .then((data: Story[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setStories([...data, ...MOCK_STORIES])
        }
      })
      .catch(() => {})
  }, [])

  // Auto-advance story viewer
  useEffect(() => {
    if (viewingIndex === null) {
      setProgress(0)
      if (progressRef.current) clearInterval(progressRef.current)
      return
    }
    setProgress(0)
    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          // advance to next
          setViewingIndex((idx) => {
            if (idx === null) return null
            if (idx < stories.length - 1) return idx + 1
            return null
          })
          return 0
        }
        return p + 2 // 5s total (100/2 = 50 ticks * 100ms)
      })
    }, 100)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [viewingIndex, stories.length])

  const openStory = (index: number) => {
    setViewingIndex(index)
    setViewed((v) => new Set([...v, stories[index].id]))
  }

  const closeStory = () => setViewingIndex(null)

  const postStory = async () => {
    if (!draft.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      })
      if (res.ok) {
        const newStory = await res.json()
        setStories((prev) => [newStory, ...prev])
      } else {
        // Optimistic fallback
        const optimistic: Story = {
          id: `story-${Date.now()}`,
          content: draft.trim(),
          createdAt: new Date().toISOString(),
          author: { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatarInitials },
        }
        setStories((prev) => [optimistic, ...prev])
      }
    } catch {
      const optimistic: Story = {
        id: `story-${Date.now()}`,
        content: draft.trim(),
        createdAt: new Date().toISOString(),
        author: { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatarInitials },
      }
      setStories((prev) => [optimistic, ...prev])
    }
    setDraft('')
    setComposerOpen(false)
    setPosting(false)
  }

  const viewingStory = viewingIndex !== null ? stories[viewingIndex] : null

  return (
    <>
      {/* Stories scrollable bar */}
      <div className="flex items-center gap-3 overflow-x-auto px-4 py-3 border-b border-border scrollbar-none">
        {/* Add story button */}
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
          aria-label="Add story"
        >
          <div className="relative h-14 w-14 rounded-full border-2 border-dashed border-green-500/60 bg-green-500/10 flex items-center justify-center hover:border-green-500 hover:bg-green-500/20 transition-colors">
            <Plus className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-[10px] text-muted-foreground">Add</span>
        </button>

        {stories.map((story, i) => {
          const isViewed = viewed.has(story.id)
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => openStory(i)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div
                className={cn(
                  'h-14 w-14 rounded-full p-[2px]',
                  isViewed
                    ? 'bg-muted'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                )}
              >
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
                  {story.author.avatar}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground max-w-[56px] truncate">
                {story.author.handle.split('@')[0]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Story viewer modal */}
      {viewingStory && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          role="dialog"
          aria-modal="true"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: i === viewingIndex ? `${progress}%` : i < (viewingIndex ?? 0) ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Author info */}
          <div className="absolute top-6 left-4 flex items-center gap-2 z-10">
            <div className="h-9 w-9 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {viewingStory.author.avatar}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{viewingStory.author.name}</p>
              <p className="text-white/70 text-xs">{timeAgo(viewingStory.createdAt)} · {expiresIn(viewingStory.createdAt)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeStory}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close story"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Navigation */}
          {viewingIndex !== null && viewingIndex > 0 && (
            <button
              type="button"
              onClick={() => { setViewingIndex(viewingIndex - 1); setViewed((v) => new Set([...v, stories[viewingIndex - 1].id])) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Previous story"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {viewingIndex !== null && viewingIndex < stories.length - 1 && (
            <button
              type="button"
              onClick={() => { setViewingIndex(viewingIndex + 1); setViewed((v) => new Set([...v, stories[viewingIndex + 1].id])) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Next story"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Story content */}
          <div className="max-w-sm w-full mx-auto px-8 text-center">
            {viewingStory.image && (
              <img src={viewingStory.image} alt="" className="w-full rounded-2xl mb-6 max-h-64 object-cover" />
            )}
            <p className="text-white text-2xl font-bold leading-relaxed">{viewingStory.content}</p>
          </div>
        </div>
      )}

      {/* Story composer modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">New Story</h3>
              <button type="button" onClick={() => setComposerOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 200))}
              placeholder="Share a hot take, update, or football thought..."
              rows={4}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{draft.length}/200 · Expires in 24h</span>
              <button
                type="button"
                onClick={postStory}
                disabled={!draft.trim() || posting}
                className="rounded-xl bg-green-600 hover:bg-green-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                {posting ? 'Posting…' : 'Post Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
