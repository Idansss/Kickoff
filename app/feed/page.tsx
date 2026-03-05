'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { feedStore } from '@/store/feedStore'
import { userStore } from '@/store/userStore'
import { FeedPostCard } from '@/components/feed/FeedPostCard'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { INPUT_LIMITS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { TrendingStrip } from '@/components/NewComponents'

const MAX_LENGTH = INPUT_LIMITS.postMaxLength
const TAGS = ['General', 'PL', 'UCL', 'Transfer', 'Stats', 'SerieA', 'LaLiga'] as const
type FeedTag = (typeof TAGS)[number]

type FeedTab = 'foryou' | 'following'

function FeedPageInner(): React.JSX.Element {
  const posts = feedStore((s) => s.posts)
  const initPosts = feedStore((s) => s.initPosts)
  const addPost = feedStore((s) => s.addPost)
  const mutedUsers = feedStore((s) => s.mutedUsers)
  const blockedUsers = feedStore((s) => s.blockedUsers)
  const hiddenPosts = feedStore((s) => s.hiddenPosts)
  const currentUser = userStore((s) => s.currentUser)

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou')
  const [selectedTag, setSelectedTag] = useState<FeedTag>('General')
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const hashtag = searchParams.get('hashtag')
    if (hashtag) setActiveHashtag(hashtag.startsWith('#') ? hashtag : `#${hashtag}`)
  }, [searchParams])

  const charsLeft = MAX_LENGTH - content.length
  const isOverLimit = charsLeft < 0
  const isNearLimit = charsLeft <= 30 && !isOverLimit

  useEffect(() => {
    initPosts()
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [initPosts])

  const displayedPosts = useMemo(() => {
    let list = activeTab === 'following'
      ? posts.filter((post) => post.author.verified)
      : posts
    list = list.filter(
      (post) =>
        !mutedUsers.includes(post.author.handle) &&
        !blockedUsers.includes(post.author.id) &&
        !hiddenPosts.includes(post.id)
    )
    if (activeHashtag) {
      const tag = activeHashtag.startsWith('#') ? activeHashtag.slice(1) : activeHashtag
      list = list.filter((post) =>
        (post.hashtags ?? []).some((h) => h === tag || h === activeHashtag || `#${h}` === activeHashtag)
      )
    }
    return list
  }, [activeTab, posts, mutedUsers, blockedUsers, hiddenPosts, activeHashtag])

  const handlePost = useCallback((): void => {
    const normalizedContent = content.trim()
    if (!normalizedContent || isOverLimit || posting) return

    setPosting(true)
    addPost(normalizedContent, selectedTag)
    setContent('')
    setPosting(false)
  }, [addPost, content, isOverLimit, posting, selectedTag])

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.ctrlKey) handlePost()
  }, [handlePost])

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'foryou', label: 'For You' },
    { key: 'following', label: 'Following' },
  ]

  const getTrendingTopics = feedStore((s) => s.getTrendingTopics)
  const trendingTopics = useMemo(
    () => getTrendingTopics().map((t) => t.tag),
    [getTrendingTopics, posts]
  )

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="px-4 pt-4 pb-0 sm:px-6">
            <h1 className="text-xl font-bold mb-3">Feed</h1>
          </div>
          <div className="flex px-4 sm:px-6 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-green-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-2">
          <TrendingStrip
            onFilter={(pill: string | null) => setActiveHashtag(pill ?? null)}
            topics={trendingTopics.length > 0 ? trendingTopics : undefined}
          />
        </div>

        <div className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.avatarInitials}
            </div>
            <div className="flex-1">
              <Textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your football thoughts..."
                className="border-0 px-0 py-1 outline-none focus-visible:ring-0 resize-none text-sm"
                maxLength={MAX_LENGTH + 50}
                aria-label="Create post"
              />
              <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={cn(
                        'text-xs px-2 py-1 rounded border transition-colors',
                        selectedTag === tag
                          ? 'border-green-500 bg-green-500/10 text-green-600'
                          : 'border-border text-muted-foreground hover:border-green-500/50'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                  {content.length > 0 && (
                    <>
                      <div className="relative h-5 w-5">
                        <svg className="h-5 w-5 -rotate-90" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
                          <circle
                            cx="12" cy="12" r="9"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeDasharray={`${2 * Math.PI * 9}`}
                            strokeDashoffset={`${2 * Math.PI * 9 * (1 - Math.min(content.length / MAX_LENGTH, 1))}`}
                            className={cn('transition-all', isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-green-500')}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span
                        className={cn(
                          'text-xs tabular-nums',
                          isOverLimit ? 'text-red-500 font-semibold' : isNearLimit ? 'text-yellow-500' : 'text-muted-foreground'
                        )}
                      >
                        {charsLeft}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:block">Ctrl+Enter</span>
                  <Button
                    size="sm"
                    disabled={!content.trim() || isOverLimit || posting}
                    onClick={handlePost}
                    className="bg-green-500 hover:bg-green-600 text-white h-8 px-4"
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="space-y-0">
              <SkeletonLoader variant="post" />
              <SkeletonLoader variant="post" />
              <SkeletonLoader variant="post" />
            </div>
          ) : displayedPosts.length > 0 ? (
            displayedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-3xl">⚽</div>
              <p className="text-muted-foreground text-sm">
                {activeTab === 'following' ? 'No posts from people you follow yet' : 'No posts yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function FeedPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <FeedPageInner />
    </Suspense>
  )
}
