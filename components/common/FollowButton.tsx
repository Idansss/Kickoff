'use client'

import { useState, useTransition } from 'react'
import { UserPlus2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { followStore, type FollowEntityType } from '@/store/followStore'

interface FollowButtonProps {
  entityType: FollowEntityType
  entityId: string
  size?: 'sm' | 'md'
}

export function FollowButton({ entityType, entityId, size = 'sm' }: FollowButtonProps) {
  const isFollowing = followStore((s) => s.isFollowing(entityType, entityId))
  const follow = followStore((s) => s.follow)
  const unfollow = followStore((s) => s.unfollow)
  const [isPending, startTransition] = useTransition()
  const [localError, setLocalError] = useState<string | null>(null)

  const handleToggle = () => {
    if (!entityId) return
    setLocalError(null)

    const nextFollowing = !isFollowing
    if (nextFollowing) {
      follow(entityType, entityId)
    } else {
      unfollow(entityType, entityId)
    }

    startTransition(() => {
      void fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextFollowing ? 'FOLLOW' : 'UNFOLLOW',
          entityType,
          entityId,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Request failed')
          }
          const json = (await res.json()) as { following: boolean }
          if (json.following !== nextFollowing) {
            if (nextFollowing) {
              unfollow(entityType, entityId)
            } else {
              follow(entityType, entityId)
            }
          }
        })
        .catch(() => {
          if (nextFollowing) {
            unfollow(entityType, entityId)
          } else {
            follow(entityType, entityId)
          }
          setLocalError('Unable to update follow. Please try again.')
        })
    })
  }

  const label = isFollowing ? 'Following' : 'Follow'
  const variant = isFollowing ? 'outline' : 'default'
  const sizeProp = size === 'md' ? 'default' : 'sm'

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        size={sizeProp as any}
        variant={variant as any}
        disabled={isPending || !entityId}
        onClick={handleToggle}
        className={isFollowing ? 'border-emerald-500 text-emerald-600' : undefined}
      >
        {isFollowing ? (
          <Check className="mr-1 h-4 w-4" />
        ) : (
          <UserPlus2 className="mr-1 h-4 w-4" />
        )}
        {label}
      </Button>
      {localError ? (
        <span className="text-[11px] text-red-500">{localError}</span>
      ) : null}
    </div>
  )
}

