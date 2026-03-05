'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { Bookmark, Heart, MessageCircle, Repeat2, Share } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LegacyPost as Post } from '@/types'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onBookmark?: (postId: string) => void
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function parsePostContent(content: string): Array<{ type: 'text' | 'hashtag' | 'mention'; value: string }> {
  const parts: Array<{ type: 'text' | 'hashtag' | 'mention'; value: string }> = []
  const regex = /(#\w+|@\w+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }

    parts.push({
      type: match[0].startsWith('#') ? 'hashtag' : 'mention',
      value: match[0],
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: content }]
}

function PostCardComponent({ post, onLike, onBookmark }: PostCardProps): React.JSX.Element {
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const postedAt = useMemo(() => formatRelativeDate(post.createdAt), [post.createdAt])
  const parsedContent = useMemo(() => parsePostContent(post.content), [post.content])

  const handleLike = useCallback((): void => {
    setIsLiked((value) => !value)
    setLikeCount((value) => (isLiked ? value - 1 : value + 1))
    onLike?.(post.id)
  }, [isLiked, onLike, post.id])

  const handleBookmark = useCallback((): void => {
    setIsBookmarked((value) => !value)
    onBookmark?.(post.id)
  }, [onBookmark, post.id])

  return (
    <article className="border-b border-border px-4 py-4 transition-colors hover:bg-muted/30 sm:px-6">
      <div className="flex gap-4">
        <Link href={`/user/${post.author.id}`} className="flex-shrink-0">
          <Image
            src={post.author.avatar}
            alt={post.author.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full"
            priority
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Link
                href={`/user/${post.author.id}`}
                className="font-semibold text-foreground hover:underline"
              >
                {post.author.name}
              </Link>
              <span className="text-muted-foreground">@{post.author.handle}</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-muted-foreground text-sm">{postedAt}</span>
            </div>
          </div>

          <p className="mt-2 text-foreground break-words">
            {parsedContent.map((part, index) =>
              part.type === 'text' ? (
                <span key={`${part.type}-${index}`}>{part.value}</span>
              ) : (
                <span key={`${part.type}-${index}`} className="text-green-600">
                  {part.value}
                </span>
              )
            )}
          </p>

          {post.relatedPlayer ? (
            <Link
              href={`/player/${post.relatedPlayer.id}`}
              className="mt-3 flex items-center gap-2 rounded border border-border p-3 text-sm hover:bg-muted"
            >
              <Image
                src={post.relatedPlayer.avatar}
                alt={post.relatedPlayer.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
              <div>
                <div className="font-semibold">{post.relatedPlayer.name}</div>
                <div className="text-muted-foreground">
                  {post.relatedPlayer.position} · {post.relatedPlayer.club.name}
                </div>
              </div>
            </Link>
          ) : null}

          {post.relatedMatch ? (
            <Link
              href={`/match/${post.relatedMatch.id}`}
              className="mt-3 flex items-center justify-between rounded border border-border p-3 hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={post.relatedMatch.homeTeam.logo}
                  alt={post.relatedMatch.homeTeam.name}
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <span className="text-sm font-medium">{post.relatedMatch.homeTeam.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {post.relatedMatch.status === 'finished'
                  ? `${post.relatedMatch.homeScore} - ${post.relatedMatch.awayScore}`
                  : 'vs'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{post.relatedMatch.awayTeam.name}</span>
                <Image
                  src={post.relatedMatch.awayTeam.logo}
                  alt={post.relatedMatch.awayTeam.name}
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </div>
            </Link>
          ) : null}

          <div className="mt-4 flex justify-between text-muted-foreground max-w-xs">
            <button
              className="flex items-center gap-2 transition-colors hover:text-accent"
              aria-label="Reply to post"
            >
              <div className="rounded-full p-2 hover:bg-accent/10">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-xs">{post.replies}</span>
            </button>

            <button
              className="flex items-center gap-2 transition-colors hover:text-accent"
              aria-label="Repost"
            >
              <div className="rounded-full p-2 hover:bg-accent/10">
                <Repeat2 className="h-4 w-4" />
              </div>
              <span className="text-xs">{post.reposts}</span>
            </button>

            <button
              onClick={handleLike}
              className="flex items-center gap-2 transition-colors hover:text-red-500"
              aria-label="Like post"
            >
              <div className="rounded-full p-2 hover:bg-red-500/10">
                <Heart className={cn('h-4 w-4', { 'fill-red-500 text-red-500': isLiked })} />
              </div>
              <span className="text-xs">{likeCount}</span>
            </button>

            <button
              className="flex items-center gap-2 transition-colors hover:text-accent"
              aria-label="Share post"
            >
              <div className="rounded-full p-2 hover:bg-accent/10">
                <Share className="h-4 w-4" />
              </div>
              <span className="text-xs">{post.shares}</span>
            </button>

            <button
              className={cn(
                'flex items-center gap-2 transition-colors',
                isBookmarked ? 'text-green-600' : 'hover:text-accent'
              )}
              aria-label="Bookmark post"
              onClick={handleBookmark}
            >
              <div className="rounded-full p-2 hover:bg-accent/10">
                <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-green-600')} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export const PostCard = memo(PostCardComponent)
