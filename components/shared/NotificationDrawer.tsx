'use client'

import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X } from 'lucide-react'
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
}: NotificationDrawerProps) {
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

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Notifications</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-sm text-green-600 hover:underline"
                aria-label="Mark all notifications as read"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(100%-60px)]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                className={cn(
                  'flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors',
                  !n.read && 'bg-muted/30'
                )}
                aria-label={!n.read ? 'Unread notification' : 'Read notification'}
              >
                  <div
                    className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: n.avatarColor }}
                  >
                    {n.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
