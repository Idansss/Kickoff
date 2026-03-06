'use client'

import { useEffect, useMemo, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
  notifications: readonly Notification[]
  onMarkAllRead: () => void
  onMarkRead?: (id: string) => void
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationDrawerProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return

      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length === 0) return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement | null

      if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    if (isOpen) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleTabTrap)
      document.body.style.overflow = 'hidden'

      requestAnimationFrame(() => {
        const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      })
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTabTrap)
      document.body.style.overflow = ''
      lastFocusedElementRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  const grouped = useMemo(() => {
    const unread = notifications.filter((n) => !n.read)
    const read = notifications.filter((n) => n.read)
    return { unread, read }
  }, [notifications])

  const navigateFor = (n: Notification) => {
    onMarkRead?.(n.id)
    if (n.type === 'like') {
      const postId = n.postId
      if (postId) router.push(`/feed?post=${encodeURIComponent(postId)}&highlight=1`)
      else router.push('/feed')
      onClose()
      return
    }
    if (n.type === 'reply') {
      const postId = n.postId
      if (postId)
        router.push(
          `/feed?post=${encodeURIComponent(postId)}&highlight=1&openReplies=1`
        )
      else router.push('/feed')
      onClose()
      return
    }
    if (n.type === 'follow') {
      const userId = n.userId
      router.push(userId ? `/user/${encodeURIComponent(userId)}` : '/profile')
      onClose()
      return
    }
    if (n.type === 'goal_alert') {
      const matchId = n.matchId
      router.push(matchId ? `/matches?id=${encodeURIComponent(matchId)}` : '/matches')
      onClose()
      return
    }
    if (n.type === 'badge_earned') {
      const badgeId = n.badgeId
      router.push(
        badgeId
          ? `/profile?tab=badges&badge=${encodeURIComponent(badgeId)}`
          : '/profile?tab=badges'
      )
      onClose()
      return
    }
    if (n.type === 'prediction_result') {
      router.push('/profile?tab=achievements')
      onClose()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={cn('fixed z-50 right-5 top-20')}
        style={{ width: 380, maxWidth: 'calc(100vw - 24px)' }}
      >
        <div
          className={cn(
            'rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden',
            'bg-white dark:bg-[#111111]'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] dark:border-[#1f1f1f]">
            <h2 className="text-[18px] font-extrabold">Notifications</h2>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-[13px] text-green-600 hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground text-[18px] leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div>
              {grouped.unread.length > 0 && (
                <div className="px-5 pt-2.5 pb-1 text-[10px] font-bold tracking-[1px] text-[#9ca3af]">
                  NEW
                </div>
              )}
              {grouped.unread.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigateFor(n)}
                  className={cn(
                    'relative w-full text-left px-5 py-3.5 flex gap-3 items-start border-b',
                    'border-[#f5f5f5] dark:border-[#1a1a1a]',
                    'transition-[background] duration-150 cursor-pointer',
                    'bg-[rgba(22,163,74,0.04)] dark:bg-[rgba(22,163,74,0.06)]',
                    'hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[#1a1a1a]'
                  )}
                >
                  <div
                    className="h-[42px] w-[42px] rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: n.avatarColor }}
                  >
                    {n.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-[1.45] text-foreground">{n.text}</p>
                    <p className="text-[11px] text-[#9ca3af] mt-[3px]">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="absolute right-5 top-4 h-2 w-2 rounded-full bg-green-500" />
                </button>
              ))}

              {grouped.read.length > 0 && (
                <div className="px-5 pt-3 pb-1 text-[10px] font-bold tracking-[1px] text-[#9ca3af]">
                  EARLIER
                </div>
              )}
              {grouped.read.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigateFor(n)}
                  className={cn(
                    'relative w-full text-left px-5 py-3.5 flex gap-3 items-start border-b',
                    'border-[#f5f5f5] dark:border-[#1a1a1a]',
                    'transition-[background] duration-150 cursor-pointer',
                    'hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[#1a1a1a]'
                  )}
                >
                  <div
                    className="h-[42px] w-[42px] rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: n.avatarColor }}
                  >
                    {n.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-[1.45] text-foreground">{n.text}</p>
                    <p className="text-[11px] text-[#9ca3af] mt-[3px]">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
