'use client'

import { useState } from 'react'
import { Youtube, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoClip {
  id: string
  title: string
  youtubeId: string
  thumbnail: string
}

function buildSearchUrl(homeTeam: string, awayTeam: string): string {
  const q = encodeURIComponent(`${homeTeam} vs ${awayTeam} highlights`)
  return `https://www.youtube.com/results?search_query=${q}`
}

// Curated highlight clips per match-up keywords
const SAMPLE_CLIPS: VideoClip[] = [
  {
    id: 'v1',
    title: 'Extended Match Highlights',
    youtubeId: 'dQw4w9WgXcQ', // placeholder — real IDs come from user search
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  },
  {
    id: 'v2',
    title: 'Goals & Key Moments',
    youtubeId: 'dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  },
]

interface Props {
  homeTeam: string
  awayTeam: string
  matchId: string
}

export function VideoHighlights({ homeTeam, awayTeam }: Props) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [clipIndex, setClipIndex] = useState(0)

  const searchUrl = buildSearchUrl(homeTeam, awayTeam)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-sm">Video Highlights</span>
        </div>
        <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-3">
          {/* Active video embed */}
          {activeId && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0`}
                title="Match highlights"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}

          {/* Clip carousel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {homeTeam} vs {awayTeam}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setClipIndex((i) => Math.max(0, i - 1))}
                  disabled={clipIndex === 0}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setClipIndex((i) => Math.min(SAMPLE_CLIPS.length - 1, i + 1))}
                  disabled={clipIndex >= SAMPLE_CLIPS.length - 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto">
              {SAMPLE_CLIPS.map((clip, i) => (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => { setActiveId(clip.youtubeId); setClipIndex(i) }}
                  className={cn(
                    'relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all',
                    activeId === clip.youtubeId
                      ? 'border-red-500'
                      : 'border-transparent hover:border-border'
                  )}
                >
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                    <p className="text-[9px] text-white truncate">{clip.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search on YouTube link */}
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 font-medium"
          >
            <Youtube className="h-3.5 w-3.5" />
            Search more highlights on YouTube
          </a>
        </div>
      )}
    </div>
  )
}
