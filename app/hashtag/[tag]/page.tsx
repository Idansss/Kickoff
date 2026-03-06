'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { FeedPostCard } from '@/components/feed/FeedPostCard'
import { feedStore } from '@/store/feedStore'
import { ChevronLeft, Hash, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HashtagPage() {
  const params = useParams()
  const router = useRouter()
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : (params.tag ?? '')
  const tag = decodeURIComponent(rawTag).replace(/^#/, '')

  const posts = feedStore((s) => s.posts)
  const trendingTopics = feedStore((s) => s.getTrendingTopics())

  const taggedPosts = useMemo(() => {
    const normalizedTag = tag.toLowerCase()
    return posts
      .filter((p) =>
        (p.hashtags ?? []).some(
          (h) => h.toLowerCase() === normalizedTag || h.toLowerCase() === `#${normalizedTag}`
        ) || p.content.toLowerCase().includes(`#${normalizedTag}`)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [posts, tag])

  const topicStats = trendingTopics.find(
    (t) => t.tag.replace(/^#/, '').toLowerCase() === tag.toLowerCase()
  )

  // Also search related tags
  const relatedTags = useMemo(() => {
    return trendingTopics
      .filter((t) => t.tag.replace(/^#/, '').toLowerCase() !== tag.toLowerCase())
      .slice(0, 6)
  }, [trendingTopics, tag])

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-green-600" />
                <h1 className="text-xl font-bold">{tag}</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {taggedPosts.length} post{taggedPosts.length !== 1 ? 's' : ''}
                {topicStats ? ` · trending` : ''}
              </p>
            </div>
            {topicStats && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-semibold">{topicStats.count} mentions</span>
              </div>
            )}
          </div>
        </div>

        {/* Related hashtags */}
        {relatedTags.length > 0 && (
          <div className="px-4 py-3 border-b border-border sm:px-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Trending now</p>
            <div className="flex flex-wrap gap-2">
              {relatedTags.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => router.push(`/hashtag/${encodeURIComponent(t.tag.replace(/^#/, ''))}`)}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  <Hash className="h-3 w-3" />
                  {t.tag.replace(/^#/, '')}
                  <span className="text-muted-foreground">({t.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {taggedPosts.length > 0 ? (
          <div>
            {taggedPosts.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Hash className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No posts for #{tag}</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Be the first to post with this hashtag in the feed.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
