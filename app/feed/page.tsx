'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { feedStore } from '@/store/feedStore'
import { userStore } from '@/store/userStore'
import { FeedPostCard } from '@/components/feed/FeedPostCard'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { INPUT_LIMITS } from '@/lib/constants'
import { cn, scrollToAndHighlight } from '@/lib/utils'
import { TrendingStrip } from '@/components/NewComponents'
import { StoriesBar } from '@/components/stories/StoriesBar'
import { useComposerTokens } from '@/hooks/useComposerTokens'
import { highlightMatch } from '@/lib/highlightMatch'
import { PostToolbar } from '@/components/composer/PostToolbar'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useRealTimeFeed } from '@/hooks/useRealTimeFeed'

const MAX_LENGTH = INPUT_LIMITS.postMaxLength
const TAGS = ['General', 'PL', 'UCL', 'Transfer', 'Stats', 'SerieA', 'LaLiga'] as const
type FeedTag = (typeof TAGS)[number]

type FeedTab = 'foryou' | 'following'

function InfiniteFeedList({
  posts,
  loading,
  activeTab,
  focusPostId,
  shouldHighlight,
  shouldOpenReplies,
  onDiscoverPeople,
}: {
  posts: ReturnType<typeof feedStore.getState>['posts']
  loading: boolean
  activeTab: FeedTab
  focusPostId: string
  shouldHighlight: boolean
  shouldOpenReplies: boolean
  onDiscoverPeople: () => void
}) {
  const { displayed, hasMore, sentinelRef } = useInfiniteScroll(posts, 20)

  if (loading) {
    return (
      <div className="space-y-0">
        <SkeletonLoader variant="post" />
        <SkeletonLoader variant="post" />
        <SkeletonLoader variant="post" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="text-3xl">⚽</div>
        <p className="text-muted-foreground text-sm">
          {activeTab === 'following'
            ? "You're not following anyone yet. Follow users to see their posts here."
            : 'No posts yet'}
        </p>
        {activeTab === 'following' && (
          <button
            type="button"
            onClick={onDiscoverPeople}
            className="mt-1 text-sm font-semibold text-green-600 hover:underline"
          >
            Discover People →
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {displayed.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          focusPostId={focusPostId || undefined}
          highlightFocus={shouldHighlight}
          openRepliesForFocus={shouldOpenReplies}
        />
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="py-4 flex justify-center">
          <SkeletonLoader variant="post" />
        </div>
      )}
    </>
  )
}

function FeedPageInner(): React.JSX.Element {
  const posts = feedStore((s) => s.posts)
  const addPost = feedStore((s) => s.addPost)
  const mutedUsers = feedStore((s) => s.mutedUsers)
  const blockedUsers = feedStore((s) => s.blockedUsers)
  const hiddenPosts = feedStore((s) => s.hiddenPosts)
  const currentUser = userStore((s) => s.currentUser)
  const followingIds = userStore((s) => s.followingIds)

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou')
  const [selectedTag, setSelectedTag] = useState<FeedTag>('General')
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [showPoll, setShowPoll] = useState(false)
  const [pollA, setPollA] = useState('')
  const [pollB, setPollB] = useState('')
  const [aiRanked, setAiRanked] = useState(false)
  const [aiRankedIds, setAiRankedIds] = useState<string[]>([])
  const [aiRanking, setAiRanking] = useState(false)

  const composerRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { newCount, clearNewCount } = useRealTimeFeed(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const focusPostId = searchParams.get('post') ?? ''
  const shouldHighlight = searchParams.get('highlight') === '1'
  const shouldOpenReplies = searchParams.get('openReplies') === '1'

  useEffect(() => {
    const hashtag = searchParams.get('hashtag')
    if (hashtag) {
      setActiveHashtag(hashtag.startsWith('#') ? hashtag : `#${hashtag}`)
    } else {
      setActiveHashtag(null)
    }
  }, [searchParams])

  const charsLeft = MAX_LENGTH - content.length
  const isOverLimit = charsLeft < 0
  const isNearLimit = charsLeft <= 30 && !isOverLimit

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!focusPostId) return
    scrollToAndHighlight(`post-${focusPostId}`)
  }, [focusPostId])

  useEffect(() => {
    imageUrls.forEach((u) => URL.revokeObjectURL(u))
    const urls = images.map((f) => URL.createObjectURL(f))
    setImageUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [images])

  const tokens = useComposerTokens(content, cursorPosition)
  const { activeToken, hashtagSuggestions, mentionSuggestions, showSuggestions, highlightedIndex, setHighlightedIndex, resetHighlight, suggestionCount } = tokens

  useEffect(() => {
    if (showSuggestions) setSuggestionsOpen(true)
  }, [showSuggestions])

  useEffect(() => {
    if (!showSuggestions || !suggestionsOpen) return
    const onDown = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false)
        resetHighlight()
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showSuggestions, suggestionsOpen, resetHighlight])

  const insertAtCursor = (str: string) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? content.length
    const end = el?.selectionEnd ?? content.length
    const before = content.slice(0, start)
    const after = content.slice(end)
    const next = before + str + after
    setContent(next)
    const nextPos = before.length + str.length
    setCursorPosition(nextPos)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(nextPos, nextPos)
    })
  }

  const replaceToken = (replacement: string) => {
    if (!activeToken.type) return
    const before = content.slice(0, activeToken.start)
    const after = content.slice(activeToken.end)
    const next = before + replacement + ' ' + after
    setContent(next)
    const nextPos = (before + replacement + ' ').length
    setCursorPosition(nextPos)
    setSuggestionsOpen(false)
    resetHighlight()
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextPos, nextPos)
    })
  }

  const displayedPosts = useMemo(() => {
    let list = [...posts]

    list = list.filter(
      (post) =>
        !mutedUsers.includes(post.author.handle) &&
        !blockedUsers.includes(post.author.id) &&
        !hiddenPosts.includes(post.id)
    )

    if (activeHashtag) {
      const tag = activeHashtag.startsWith('#') ? activeHashtag.slice(1) : activeHashtag
      list = list.filter((post) =>
        (post.hashtags ?? []).some(
          (h) => h === tag || h === activeHashtag || `#${h}` === activeHashtag
        )
      )
    }

    if (activeTab === 'following') {
      list = list.filter((post) => {
        const isAuthorFollowed = followingIds.includes(post.author.id)
        const repostedBy = post.repostedBy
        const isRepostFromFollowed =
          Boolean(post.repostOfPostId) && typeof repostedBy === 'string' && followingIds.includes(repostedBy)
        return isAuthorFollowed || isRepostFromFollowed
      })
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    // For You: if AI ranked, use AI order; else engagement + verified
    if (aiRanked && aiRankedIds.length > 0) {
      const orderMap = new Map(aiRankedIds.map((id, i) => [id, i]))
      return list.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999))
    }

    return list.sort((a, b) => {
      const va = a.author.verified ? 1 : 0
      const vb = b.author.verified ? 1 : 0
      if (vb !== va) return vb - va
      const ea = (a.likes ?? 0) + (a.reposts ?? 0)
      const eb = (b.likes ?? 0) + (b.reposts ?? 0)
      if (eb !== ea) return eb - ea
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [
    activeTab,
    posts,
    mutedUsers,
    blockedUsers,
    hiddenPosts,
    activeHashtag,
    followingIds,
    aiRanked,
    aiRankedIds,
  ])

  const handlePost = useCallback((): void => {
    const normalizedContent = content.trim()
    if (!normalizedContent || isOverLimit || posting) return

    setPosting(true)
    const poll =
      showPoll && pollA.trim() && pollB.trim()
        ? {
            question: 'Poll',
            options: [
              { id: 'opt1', text: pollA.trim(), votes: 0 },
              { id: 'opt2', text: pollB.trim(), votes: 0 },
            ],
            totalVotes: 0,
            endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }
        : undefined
    addPost(normalizedContent, selectedTag, poll, imageUrls)
    setContent('')
    setImages([])
    setShowPoll(false)
    setPollA('')
    setPollB('')
    setPosting(false)
  }, [addPost, content, imageUrls, isOverLimit, pollA, pollB, posting, selectedTag, showPoll])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape' && showSuggestions && suggestionsOpen) {
        setSuggestionsOpen(false)
        resetHighlight()
        return
      }
      if (showSuggestions && suggestionsOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setHighlightedIndex(highlightedIndex + 1)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setHighlightedIndex(highlightedIndex - 1)
        }
        if ((e.key === 'Enter' || e.key === 'Tab') && suggestionCount > 0) {
          e.preventDefault()
          if (activeToken.type === 'hashtag' && hashtagSuggestions[highlightedIndex]) {
            replaceToken(hashtagSuggestions[highlightedIndex].tag)
          }
          if (activeToken.type === 'mention' && mentionSuggestions[highlightedIndex]) {
            const s = mentionSuggestions[highlightedIndex]
            const insert = s.type === 'user' ? '@' + s.data.handle : '@' + s.data.name
            replaceToken(insert)
          }
        }
        return
      }
      if (e.key === 'Enter' && e.ctrlKey) handlePost()
    },
    [
      activeToken.type,
      handlePost,
      hashtagSuggestions,
      highlightedIndex,
      mentionSuggestions,
      replaceToken,
      resetHighlight,
      setHighlightedIndex,
      showSuggestions,
      suggestionCount,
      suggestionsOpen,
    ]
  )

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'foryou', label: 'For You' },
    { key: 'following', label: 'Following' },
  ]

  const rankWithAI = useCallback(async () => {
    if (aiRanking) return
    setAiRanking(true)
    try {
      const postsToRank = posts.slice(0, 50).map((p) => ({
        id: p.id,
        content: p.content,
        likes: p.likes,
        reposts: p.reposts,
        tag: p.tag,
        authorVerified: p.author.verified ?? false,
      }))
      const interests = currentUser?.favoriteTeams ?? []
      const res = await fetch('/api/ai/rank-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: postsToRank, interests }),
      })
      const data = await res.json() as { rankedIds: string[] }
      setAiRankedIds(data.rankedIds ?? [])
      setAiRanked(true)
    } catch {
      // ignore
    }
    setAiRanking(false)
  }, [aiRanking, currentUser, posts])

  const getTrendingTopics = feedStore((s) => s.getTrendingTopics)
  const trendingTopics = useMemo(
    () => getTrendingTopics().map((t) => t.tag),
    [getTrendingTopics, posts]
  )

  const clearHashtagFilter = () => {
    setActiveHashtag(null)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.delete('hashtag')
    const queryString = params.toString()
    router.push(queryString ? `/feed?${queryString}` : '/feed')
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="px-4 pt-4 pb-0 sm:px-6">
            <h1 className="text-xl font-bold mb-3">Feed</h1>
          </div>
          <div className="flex items-center px-4 sm:px-6 -mb-px">
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
            {activeTab === 'foryou' && (
              <button
                type="button"
                onClick={aiRanked ? () => { setAiRanked(false); setAiRankedIds([]) } : rankWithAI}
                disabled={aiRanking}
                className={cn(
                  'ml-auto mb-1 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  aiRanked
                    ? 'bg-green-600 text-white'
                    : 'border border-border text-muted-foreground hover:text-green-600 hover:border-green-500'
                )}
                title={aiRanked ? 'AI ranking active — click to reset' : 'Rank feed with AI'}
              >
                {aiRanking ? '...' : aiRanked ? '✦ AI On' : '✦ AI'}
              </button>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-2 space-y-2">
          {activeHashtag ? (
            <div className="flex items-center justify-between text-xs rounded-lg border border-[rgba(22,163,74,0.3)] bg-[rgba(22,163,74,0.1)] px-3 py-2 text-green-600">
              <span className="font-medium">
                Showing posts for {activeHashtag.startsWith('#') ? activeHashtag : `#${activeHashtag}`}
              </span>
              <button
                type="button"
                onClick={clearHashtagFilter}
                className="ml-3 text-[11px] font-semibold text-green-700 hover:text-green-800"
                aria-label="Clear hashtag filter"
              >
                ×
              </button>
            </div>
          ) : null}
          <StoriesBar />
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
            <div className="flex-1" ref={composerRef}>
              <Textarea
                rows={2}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setCursorPosition(e.target.selectionStart ?? e.target.value.length)
                }}
                onKeyDown={handleKeyDown}
                onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
                ref={textareaRef}
                placeholder="Share your football thoughts..."
                className="border-0 px-0 py-1 outline-none focus-visible:ring-0 resize-none text-sm"
                maxLength={MAX_LENGTH + 50}
                aria-label="Create post"
              />

              {showSuggestions && suggestionsOpen && (
                <div className="relative">
                  <div
                    className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-black/[0.08] bg-white/92 backdrop-blur-[20px]"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
                  >
                    {activeToken.type === 'hashtag' &&
                      hashtagSuggestions.map((h, i) => (
                        <button
                          key={h.tag}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
                            i === highlightedIndex && 'bg-green-500/10 border-l-[3px] border-l-green-600'
                          )}
                          onMouseEnter={() => setHighlightedIndex(i)}
                          onClick={() => replaceToken(h.tag)}
                        >
                          <div className="h-8 w-8 shrink-0 rounded flex items-center justify-center text-xs font-bold text-white bg-green-600">
                            #
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-green-600">
                              {highlightMatch(h.tag, activeToken.query)}
                            </div>
                            <div className="text-xs text-muted-foreground">{h.count} posts</div>
                          </div>
                        </button>
                      ))}

                    {activeToken.type === 'mention' &&
                      mentionSuggestions.map((s, i) => (
                        <button
                          key={s.type === 'user' ? s.data.id : s.data.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
                            i === highlightedIndex && 'bg-green-500/10 border-l-[3px] border-l-green-600'
                          )}
                          onMouseEnter={() => setHighlightedIndex(i)}
                          onClick={() =>
                            replaceToken(
                              s.type === 'user' ? '@' + s.data.handle : '@' + s.data.name
                            )
                          }
                        >
                          {s.type === 'user' ? (
                            <div
                              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: s.data.avatarColor }}
                            >
                              {s.data.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                          ) : (
                            <div
                              className="h-8 w-8 shrink-0 rounded flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: s.data.color }}
                            >
                              🛡️
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold">
                              {highlightMatch(
                                s.type === 'user' ? s.data.name : s.data.name,
                                activeToken.query
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {s.type === 'user' ? `@${s.data.handle}` : 'Official Club'}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {showPoll && (
                <div className="mt-3 space-y-2">
                  <Input
                    value={pollA}
                    onChange={(e) => setPollA(e.target.value)}
                    placeholder="Option A"
                    className="h-9"
                  />
                  <Input
                    value={pollB}
                    onChange={(e) => setPollB(e.target.value)}
                    placeholder="Option B"
                    className="h-9"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                aria-label="Upload images"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
                  setImages((prev) => [...prev, ...files].slice(0, 4))
                  e.target.value = ''
                }}
              />

              {imageUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={url} className="relative overflow-hidden rounded-xl border border-border">
                      <img src={url} alt="" className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 rounded-full bg-black/60 text-white h-6 w-6 flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <PostToolbar
                  maxChars={MAX_LENGTH}
                  charCount={content.length}
                  canPost={Boolean(content.trim()) && !isOverLimit && !posting}
                  onPost={handlePost}
                  imageCount={images.length}
                  onPickImages={() => fileInputRef.current?.click()}
                  onInsertHashtag={() => insertAtCursor('#')}
                  onInsertMention={() => insertAtCursor('@')}
                  onInsertEmoji={(e) => insertAtCursor(e)}
                  pollOn={showPoll}
                  onTogglePoll={() => setShowPoll((v) => !v)}
                  onHotTake={(text) => setContent(text)}
                />
                <div className="mt-1 text-xs text-muted-foreground hidden sm:block">
                  Ctrl+Enter to post
                </div>
              </div>
            </div>
          </div>
        </div>

        {newCount > 0 && (
          <button
            type="button"
            onClick={() => { clearNewCount(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="mx-auto my-2 flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all animate-fade-in-up"
          >
            <span>↑</span>
            {newCount} new post{newCount !== 1 ? 's' : ''}
          </button>
        )}
        <InfiniteFeedList
          posts={displayedPosts}
          loading={loading}
          activeTab={activeTab}
          focusPostId={focusPostId}
          shouldHighlight={shouldHighlight}
          shouldOpenReplies={shouldOpenReplies}
          onDiscoverPeople={() => router.push('/discovery')}
        />
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
