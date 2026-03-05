'use client'

import type { Post } from '@/types'
import { cn } from '@/lib/utils'

interface QuotePostCardProps {
  post: Post
  className?: string
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

export function QuotePostCard({ post, className }: QuotePostCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/30 p-3 mt-2',
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span
          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: post.author.avatarColor }}
        >
          {post.author.avatarInitials}
        </span>
        <span className="font-medium text-foreground">{post.author.name}</span>
        <span>@{post.author.handle}</span>
        <span>·</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>
      <p className="text-sm text-foreground break-words leading-relaxed">
        {post.content}
      </p>
    </div>
  )
}
