'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Bookmark,
  Check,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Post, Reply } from '@/types'
import { PollWidget } from './PollWidget'
import { QuotePostCard } from './QuotePostCard'
import { feedStore } from '@/store/feedStore'
import { userStore } from '@/store/userStore'
import { toastStore } from '@/store/toastStore'
import { INPUT_LIMITS } from '@/lib/constants'
import { PostMenu, ImpressionCounter } from '@/components/NewComponents'
import { mockUsers } from '@/data/mockData'

function seededRandom(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  const x = Math.sin(h) * 10000
  return x - Math.floor(x)
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return d.toLocaleDateString()
}

function parseContent(text: string) {
  const parts: { type: 'text' | 'hashtag' | 'mention'; value: string }[] = []
  const regex = /(#\w+|@\w+)/g
  let match: RegExpExecArray | null
  let lastIndex = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({
      type: match[0].startsWith('#') ? 'hashtag' : 'mention',
      value: match[0],
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  if (parts.length === 0) parts.push({ type: 'text', value: text })
  return parts
}

const DROPDOWN_STYLE =
  'absolute left-0 z-50 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
const DROPDOWN_ITEM_STYLE =
  'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-muted/80 transition-colors'

function PostImageGrid({ images, postId }: { images: string[]; postId: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const n = images.length

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : Math.max(0, i - 1)))
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : Math.min(images.length - 1, (i ?? 0) + 1)))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxIndex, images.length])

  const gridClass =
    n === 1
      ? 'grid grid-cols-1'
      : n === 2
        ? 'grid grid-cols-2 gap-1'
        : n === 3
          ? 'grid grid-cols-2 gap-1 grid-rows-2'
          : 'grid grid-cols-2 gap-1 grid-rows-2'

  return (
    <>
      <div className={cn('mt-2 overflow-hidden rounded-xl', gridClass)}>
        {n === 1 && (
          <button
            type="button"
            className="relative w-full h-[200px] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500/50"
            onClick={() => setLightboxIndex(0)}
            aria-label="View image 1"
          >
            <img src={images[0]} alt="Post attachment 1" className="w-full h-full object-cover rounded-xl" />
          </button>
        )}
        {n === 2 &&
          images.map((url, i) => (
            <button
              key={`${postId}-img-${i}`}
              type="button"
              className="relative w-full h-[180px] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500/50"
              onClick={() => setLightboxIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={url} alt={`Post attachment ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
            </button>
          ))}
        {n === 3 && (
          <>
            <button
              type="button"
              className="col-span-2 relative w-full h-[180px] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500/50"
              onClick={() => setLightboxIndex(0)}
              aria-label="View image 1"
            >
              <img src={images[0]} alt="Post attachment 1" className="w-full h-full object-cover rounded-xl" />
            </button>
            {[1, 2].map((i) => (
              <button
                key={`${postId}-img-${i}`}
                type="button"
                className="relative w-full h-[180px] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500/50"
                onClick={() => setLightboxIndex(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={images[i]} alt={`Post attachment ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
              </button>
            ))}
          </>
        )}
        {n === 4 &&
          images.map((url, i) => (
            <button
              key={`${postId}-img-${i}`}
              type="button"
              className="relative w-full h-[180px] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500/50"
              onClick={() => setLightboxIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={url} alt={`Post attachment ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
            </button>
          ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightboxIndex(null)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {n > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i === null ? 0 : Math.max(0, i - 1)))
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i === null ? 0 : Math.min(n - 1, i + 1)))
                }}
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

function ReplyCard({
  reply,
  postId,
}: {
  reply: Reply
  postId: string
}) {
  const toggleReplyLike = feedStore((s) => s.toggleReplyLike)
  const [shareCopied, setShareCopied] = useState(false)
  const shareTimeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (shareTimeoutRef.current !== null) window.clearTimeout(shareTimeoutRef.current)
    },
    []
  )

  const handleShare = useCallback(() => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/post/${postId}#${reply.id}`
        : ''
    navigator.clipboard?.writeText(url).then(() => {
      setShareCopied(true)
      shareTimeoutRef.current = window.setTimeout(() => setShareCopied(false), 2000)
    })
  }, [postId, reply.id])

  return (
    <div className="ml-12 border-l-[3px] border-green-600 pl-3 py-2 text-sm">
      <div className="flex gap-2">
        <Link href={`/user/${reply.author.id}`} className="flex-shrink-0">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: reply.author.avatarColor }}
          >
            {reply.author.avatarInitials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/user/${reply.author.id}`}
              className="font-semibold text-sm hover:underline"
            >
              {reply.author.name}
            </Link>
            <span className="text-muted-foreground text-xs">
              @{reply.author.handle}
            </span>
            <span className="text-muted-foreground text-xs">
              · {formatDate(reply.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-foreground break-words leading-relaxed">
            {reply.content}
          </p>
          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
            <button
              onClick={() => toggleReplyLike(postId, reply.id)}
              className={cn(
                'flex items-center gap-1 transition-colors',
                reply.likedByMe ? 'text-red-500' : 'hover:text-red-500'
              )}
              aria-label="Like reply"
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5',
                  reply.likedByMe && 'fill-red-500 text-red-500'
                )}
              />
              {reply.likes}
            </button>
            <span className="flex items-center gap-1">0</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-foreground"
              aria-label="Share reply"
            >
              {shareCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Share className="h-3.5 w-3.5" />
              )}
              {shareCopied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeedPostCardProps {
  post: Post
  /** If provided, we will scroll/highlight this post when it matches */
  focusPostId?: string
  /** If true, apply highlight styling to focus post */
  highlightFocus?: boolean
  /** If true, expand replies for focus post (used for reply notifications) */
  openRepliesForFocus?: boolean
}

function FeedPostCardInner({
  post,
  focusPostId,
  highlightFocus = false,
  openRepliesForFocus = false,
}: FeedPostCardProps) {
  const currentUser = userStore((s) => s.currentUser)
  const posts = feedStore((s) => s.posts)
  const [replyBoxOpen, setReplyBoxOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState(false)
  const [repostMenuOpen, setRepostMenuOpen] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [shareMenuCopied, setShareMenuCopied] = useState(false)
  const [quoteComposerOpen, setQuoteComposerOpen] = useState(false)
  const [quoteComposerText, setQuoteComposerText] = useState('')
  const repostMenuRef = useRef<HTMLDivElement>(null)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const shareResetTimeoutRef = useRef<number | null>(null)

  const effectivePostId = post.repostOfPostId ?? post.id
  const isOriginal = !post.repostOfPostId
  const isFocusTarget = Boolean(focusPostId && focusPostId === effectivePostId)
  const focusStyleOn = highlightFocus && isFocusTarget
  const containerId = isOriginal ? `post-${post.id}` : `repost-${post.id}`
  const effectivePost = useMemo(() => {
    if (post.repostOfPostId) {
      return posts.find((p) => p.id === post.repostOfPostId) ?? post
    }
    return post
  }, [post, posts])

  const toggleLike = feedStore((s) => s.toggleLike)
  const toggleBookmark = feedStore((s) => s.toggleBookmark)
  const votePoll = feedStore((s) => s.votePoll)
  const addReply = feedStore((s) => s.addReply)
  const repostPost = feedStore((s) => s.repostPost)
  const undoRepost = feedStore((s) => s.undoRepost)
  const addQuotePost = feedStore((s) => s.addQuotePost)

  const replies = effectivePost.replies ?? []
  const commentCount = effectivePost.comments ?? 0
  const effectiveImages = effectivePost.images?.filter((url) => !!url) ?? []
  const isRepostedByMe =
    post.repostedByMe === true || post.repostedBy === currentUser?.id

  const contentParts = useMemo(() => parseContent(post.content), [post.content])

  useEffect(
    () => () => {
      if (shareResetTimeoutRef.current !== null) {
        window.clearTimeout(shareResetTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        repostMenuRef.current &&
        !repostMenuRef.current.contains(e.target as Node)
      ) {
        setRepostMenuOpen(false)
      }
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target as Node)
      ) {
        setShareMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const handleCommentClick = useCallback(() => {
    setReplyBoxOpen((open) => !open)
    if (!showReplies && replies.length > 0) setShowReplies(true)
  }, [replies.length, showReplies])

  const handleReplySubmit = useCallback(() => {
    const trimmed = replyText.trim()
    if (!trimmed || trimmed.length > INPUT_LIMITS.postMaxLength) return
    addReply(effectivePostId, trimmed)
    setReplyText('')
    setReplyBoxOpen(false)
    setShowReplies(true)
  }, [replyText, addReply, effectivePostId])

  const handleRepostClick = useCallback(() => {
    if (isRepostedByMe) {
      undoRepost(post.repostOfPostId ?? post.id)
      setRepostMenuOpen(false)
    } else {
      setRepostMenuOpen((open) => !open)
    }
  }, [isRepostedByMe, undoRepost, post.id, post.repostOfPostId])

  const handleRepostInstant = useCallback(() => {
    const originalPostId = post.repostOfPostId ?? post.id
    repostPost(originalPostId)
    setRepostMenuOpen(false)
    // Fire-and-forget API persistence
    fetch(`/api/posts/${originalPostId}/repost`, { method: 'POST' }).catch(() => {})
    toastStore.getState().showToast({
      message: '🔁 Reposted',
      undoAction: () => feedStore.getState().undoRepost(originalPostId),
      duration: 4000,
    })
  }, [repostPost, post.id, post.repostOfPostId])

  const handleQuotePostClick = useCallback(() => {
    setRepostMenuOpen(false)
    setQuoteComposerOpen(true)
    setQuoteComposerText('')
  }, [])

  const handleQuoteSubmit = useCallback(() => {
    const trimmed = quoteComposerText.trim()
    if (!trimmed || trimmed.length > INPUT_LIMITS.postMaxLength) return
    addQuotePost(post.repostOfPostId ?? post.id, trimmed)
    setQuoteComposerText('')
    setQuoteComposerOpen(false)
  }, [quoteComposerText, addQuotePost, post.id, post.repostOfPostId])

  const shareUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? `${window.location.origin}/post/${post.id}`
        : '',
    [post.id]
  )

  const handleShareCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setShareMenuCopied(true)
      shareResetTimeoutRef.current = window.setTimeout(() => {
        setShareMenuCopied(false)
      }, 2000)
    })
    setShareMenuOpen(false)
  }, [shareUrl])

  const handleShareVia = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: post.author.name,
          text: post.content,
          url: shareUrl,
        })
        .then(() => setShareMenuOpen(false))
        .catch(() => {})
    } else {
      navigator.clipboard?.writeText(shareUrl).then(() => {
        setShareMenuCopied(true)
        shareResetTimeoutRef.current = window.setTimeout(() => {
          setShareMenuCopied(false)
        }, 2000)
      })
      setShareMenuOpen(false)
    }
  }, [post.author.name, post.content, shareUrl])

  const followingIds = userStore((s) => s.followingIds)
  const muteUser = feedStore((s) => s.muteUser)
  const blockUser = feedStore((s) => s.blockUser)
  const hidePost = feedStore((s) => s.hidePost)
  const toggleFollow = userStore((s) => s.toggleFollow)
  const isFollowing = followingIds.includes(post.author.id)
  const impressionCount = useMemo(
    () =>
      Math.floor(
        post.likes * 4.2 + post.reposts * 12 + seededRandom(post.id) * 500
      ),
    [post.id]
  )

  useEffect(() => {
    if (!isFocusTarget) return
    if (openRepliesForFocus && replies.length > 0) {
      setShowReplies(true)
      setReplyBoxOpen(false)
    }
  }, [isFocusTarget, openRepliesForFocus, replies.length])

  return (
    <article
      id={containerId}
      className={cn(
        'post-card border-b border-border px-4 py-4 transition-colors hover:bg-muted/30 sm:px-6 animate-fade-in-up',
        focusStyleOn && 'bg-[rgba(22,163,74,0.04)]'
      )}
      style={
        focusStyleOn
          ? { boxShadow: '0 0 0 2px rgba(22,163,74,0.15) inset' }
          : undefined
    }
    >
      {post.repostOfPostId && (
        <div className="mb-1 text-xs text-muted-foreground flex items-center gap-1">
          <Repeat2 className="h-3.5 w-3.5 text-green-600" />
          {post.repostedBy && post.repostedBy !== currentUser.id ? (
            <span>
              {(() => {
                const reposter = mockUsers.find((u) => u.id === post.repostedBy)
                const label = reposter?.handle ?? 'Someone'
                return `🔁 ${label} reposted`
              })()}
            </span>
          ) : (
            'You reposted'
          )}
        </div>
      )}
      <div className="flex gap-3">
        <Link href={`/user/${post.author.id}`} className="flex-shrink-0">
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: post.author.avatarColor }}
          >
            {post.author.avatarInitials}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/user/${post.author.id}`}
                className="font-semibold text-sm text-foreground hover:underline"
              >
                {post.author.name}
              </Link>
              {post.author.verified && (
                <span className="text-green-600" title="Verified">
                  ✓
                </span>
              )}
              <span className="text-muted-foreground text-sm">
                @{post.author.handle}
              </span>
              <span className="text-muted-foreground text-xs">
                · {formatDate(post.createdAt)}
              </span>
              <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                {post.tag}
              </span>
            </div>
            <PostMenu
              key={`${post.id}-${isFollowing}`}
              handle={post.author.handle}
              postId={post.id}
              isFollowing={isFollowing}
              onCopyLink={() =>
                toastStore.getState().showToast({ message: '✓ Link copied', duration: 3000 })
              }
              onMute={() => muteUser(post.author.handle)}
              onBlock={() => blockUser(post.author.id)}
              onNotInterested={() => hidePost(post.id)}
              onFollowToggle={() => toggleFollow(post.author.id)}
              onReport={() =>
                toastStore.getState().showToast({ message: 'Post reported', duration: 3000 })
              }
            />
          </div>

          <p className="mt-1.5 text-sm text-foreground break-words leading-relaxed">
            {contentParts.map((part, i) =>
              part.type === 'text' ? (
                <span key={i}>{part.value}</span>
              ) : part.type === 'hashtag' ? (
                <Link key={i} href={`/hashtag/${encodeURIComponent(part.value.replace(/^#/, ''))}`} className="text-green-700 underline decoration-green-700/60 hover:decoration-green-700">
                  {part.value}
                </Link>
              ) : (
                <span key={i} className="text-green-700 underline decoration-green-700/60 cursor-pointer">
                  {part.value}
                </span>
              )
            )}
          </p>

          {effectiveImages.length > 0 && (
            <PostImageGrid images={effectiveImages} postId={effectivePostId} />
          )}

          {post.quotedPost && <QuotePostCard post={post.quotedPost} />}
          {post.poll && (
            <PollWidget
              poll={post.poll}
              onVote={(optionId) => votePoll(post.id, optionId)}
            />
          )}

          {/* Reply box (inline below post) */}
          {replyBoxOpen && (
            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setReplyBoxOpen(false)}
                  className="absolute top-0 right-0 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="rounded-lg border border-border bg-muted/30 p-2 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                      style={{
                        backgroundColor: post.author.avatarColor,
                      }}
                    >
                      {post.author.avatarInitials}
                    </span>
                    <span className="font-medium text-foreground">
                      {post.author.name}
                    </span>
                    <span>@{post.author.handle}</span>
                  </div>
                  <p className="text-foreground break-words line-clamp-2">
                    {post.content}
                  </p>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value.slice(0, INPUT_LIMITS.postMaxLength))}
                  placeholder="Write your reply..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs',
                      replyText.length >= 260
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {replyText.length} / {INPUT_LIMITS.postMaxLength}
                  </span>
                  <button
                    type="button"
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim()}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quote composer (inline below repost button area) */}
          {quoteComposerOpen && (
            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuoteComposerOpen(false)}
                  className="absolute top-0 right-0 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <QuotePostCard post={post} className="mb-3" />
                <textarea
                  value={quoteComposerText}
                  onChange={(e) =>
                    setQuoteComposerText(
                      e.target.value.slice(0, INPUT_LIMITS.postMaxLength)
                    )
                  }
                  placeholder="Add your take..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs',
                      quoteComposerText.length >= 260
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {quoteComposerText.length} / {INPUT_LIMITS.postMaxLength}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuoteSubmit}
                    disabled={!quoteComposerText.trim()}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View X replies toggle */}
          {!replyBoxOpen && replies.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReplies(!showReplies)}
              className="mt-2 text-sm text-green-600 hover:underline"
            >
              {showReplies
                ? `Hide ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`
                : `View ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`}
            </button>
          )}
          {showReplies && replies.length > 0 && (
            <div className="mt-2 space-y-1">
              {replies.map((r) => (
                <ReplyCard key={r.id} reply={r} postId={effectivePostId} />
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-6 text-muted-foreground">
            <button
              type="button"
              onClick={handleCommentClick}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors group',
                replyBoxOpen ? 'text-green-600' : 'hover:text-blue-500'
              )}
              aria-label="Reply to post"
            >
              <div
                className={cn(
                  'rounded-full p-1.5',
                  replyBoxOpen ? 'bg-green-500/10' : 'group-hover:bg-blue-500/10'
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </div>
              {commentCount}
            </button>

            <div className="relative" ref={repostMenuRef}>
              <button
                type="button"
                onClick={handleRepostClick}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-colors group',
                  isRepostedByMe ? 'text-green-600' : 'hover:text-green-500'
                )}
                aria-label="Repost"
              >
                <div
                  className={cn(
                    'rounded-full p-1.5',
                    isRepostedByMe
                      ? 'bg-green-500/10'
                      : 'group-hover:bg-green-500/10'
                  )}
                >
                  <Repeat2 className="h-3.5 w-3.5" />
                </div>
                {post.reposts}
              </button>
              {repostMenuOpen && !isRepostedByMe && (
                <div className={cn(DROPDOWN_STYLE, 'bottom-full mb-1')}>
                  <button
                    type="button"
                    className={DROPDOWN_ITEM_STYLE}
                    onClick={handleRepostInstant}
                  >
                    <Repeat2 className="h-4 w-4" />
                    Repost
                  </button>
                  <button
                    type="button"
                    className={DROPDOWN_ITEM_STYLE}
                    onClick={handleQuotePostClick}
                  >
                    <Pencil className="h-4 w-4" />
                    Quote Post
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                toggleLike(post.id)
                // Fire-and-forget API persistence
                fetch(`/api/posts/${post.id}/like`, { method: 'POST' }).catch(() => {})
              }}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors group',
                post.likedByMe ? 'text-red-500' : 'hover:text-red-500'
              )}
              aria-label="Like post"
            >
              <div className="rounded-full p-1.5 group-hover:bg-red-500/10">
                <Heart
                  className={cn(
                    'h-3.5 w-3.5',
                    post.likedByMe && 'fill-red-500 text-red-500'
                  )}
                />
              </div>
              {post.likes}
            </button>
            <button
              onClick={() => toggleBookmark(post.id)}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors group',
                post.bookmarked ? 'text-green-600' : 'hover:text-foreground'
              )}
              aria-label="Bookmark post"
            >
              <div className="rounded-full p-1.5 group-hover:bg-muted">
                <Bookmark
                  className={cn(
                    'h-3.5 w-3.5',
                    post.bookmarked && 'fill-green-600 text-green-600'
                  )}
                />
              </div>
            </button>

            <div className="relative" ref={shareMenuRef}>
              <button
                type="button"
                onClick={() => setShareMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 text-xs transition-colors group hover:text-foreground"
                aria-label="Share post"
              >
                <div className="rounded-full p-1.5 group-hover:bg-muted">
                  {shareMenuCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Share className="h-3.5 w-3.5" />
                  )}
                </div>
                {shareMenuCopied ? '✓ Copied!' : 'Share'}
              </button>
              {shareMenuOpen && (
                <div className={cn(DROPDOWN_STYLE, 'bottom-full mb-1')}>
                  <button
                    type="button"
                    className={DROPDOWN_ITEM_STYLE}
                    onClick={handleShareCopyLink}
                  >
                    🔗 Copy Link
                  </button>
                  <button
                    type="button"
                    className={DROPDOWN_ITEM_STYLE}
                    onClick={handleShareVia}
                  >
                    📤 Share via...
                  </button>
                  <button
                    type="button"
                    className={DROPDOWN_ITEM_STYLE}
                    onClick={() => setShareMenuOpen(false)}
                  >
                    ❌ Close
                  </button>
                </div>
              )}
            </div>
            <ImpressionCounter postId={post.id} impressionCount={impressionCount} />
          </div>
        </div>
      </div>
    </article>
  )
}

export const FeedPostCard = memo(FeedPostCardInner)
