'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Search,
  Zap,
  MessageCircle,
  User,
  Settings,
  Sparkles,
  Bell,
  ChevronLeft,
  ChevronRight,
  Compass,
  ArrowLeftRight,
  GitCompare,
  Trophy,
  Target,
  TrendingUp,
  Newspaper,
  MessageSquare,
  Dices,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { userStore } from '@/store/userStore'
import { SidebarSearch } from '@/components/SidebarSearch'
import { selectUnreadNotificationCount } from '@/store/userStore'
import { uiStore } from '@/store/uiStore'
import { NotificationDrawer } from '@/components/shared/NotificationDrawer'
import { useSidebarState } from '@/hooks/useSidebarState'
import { FloatingPostButton, ProfileCard } from '@/components/NewComponents'

const ICON_ROW_HEIGHT = 'h-10 min-h-10' // 40px — compact like X/TikTok
const COLLAPSED_WIDTH = 'md:w-16' // 64px

export function Sidebar() {
  const pathname = usePathname()
  const notifications = userStore((s) => s.notifications)
  const unreadCount = userStore(selectUnreadNotificationCount)
  const markAllNotificationsRead = userStore((s) => s.markAllNotificationsRead)
  const markNotificationRead = userStore((s) => s.markNotificationRead)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isOpen, toggle } = useSidebarState()

  const links = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/discovery', label: 'Discovery', icon: Compass },
    { href: '/matches', label: 'Live Matches', icon: Zap },
    { href: '/competitions', label: 'Competitions', icon: Trophy },
    { href: '/predict', label: 'Predictions', icon: Target },
    { href: '/fantasy', label: 'Fantasy', icon: TrendingUp },
    { href: '/forums', label: 'Forums', icon: MessageSquare },
    { href: '/value-quiz', label: 'Value Quiz', icon: Dices },
    { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/chat', label: 'Chat Rooms', icon: MessageCircle },
    { href: '/ai', label: 'FootballGPT', icon: Sparkles },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const router = useRouter()
  const currentUser = userStore((s) => s.currentUser)
  const openPostModal = uiStore((s) => s.openPostModal)

  const handleSignOut = () => {
    if (typeof window === 'undefined') return
    const keys = ['kickoff-feed', 'kickoff-user', 'kickoff-matches', 'kickoff-chat', 'kickoff-ui', 'kickoff-last-streak-date']
    keys.forEach((k) => window.localStorage.removeItem(k))
    window.location.href = '/'
  }

  return (
    <aside
      className={cn(
        'sidebar-kickoff hidden md:flex md:flex-col md:h-screen md:border-r md:overflow-hidden transition-[width] duration-300 ease-in-out',
        isOpen ? 'md:w-64' : COLLAPSED_WIDTH
      )}
    >
        <div
          className={cn(
            'flex flex-col h-full min-h-0 w-full min-w-0 overflow-hidden',
            isOpen ? 'p-4 gap-3' : 'py-4 gap-1 px-0 w-16'
          )}
        >
        {/* Logo + Toggle — collapsed: column centered; expanded: row */}
        <div
          className={cn(
            'flex-shrink-0 flex min-w-0',
            isOpen ? 'flex-row items-center justify-between gap-2' : 'flex-col items-center gap-2'
          )}
        >
          <Link
            href="/feed"
            title={!isOpen ? 'KICKOFF' : undefined}
            className={cn(
              'group flex items-center gap-2.5 flex-shrink-0 min-w-0 transition-all duration-300 relative',
              !isOpen && 'justify-center'
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-700/20',
                isOpen ? 'h-9 w-9 rounded-xl' : 'h-9 w-9'
              )}
            >
              K
            </div>
            <span
              className={cn(
                'sidebar-label text-xl font-bold tracking-tight overflow-hidden transition-opacity duration-150 ease',
                !isOpen ? 'opacity-0 w-0 min-w-0 overflow-hidden pointer-events-none hidden' : 'opacity-100'
              )}
            >
              KICKOFF
            </span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors flex-shrink-0',
              isOpen ? 'h-8 w-8' : 'h-7 w-7 text-[12px]'
            )}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Search — expanded: input + suggestions; collapsed: single 48px icon row */}
        <div
          className={cn(
            'flex-shrink-0 relative',
            !isOpen && 'flex items-center justify-center w-full'
          )}
        >
          {isOpen ? (
            <SidebarSearch isOpen={isOpen} />
          ) : (
            <div
              className={cn(
                'group relative flex items-center justify-center w-full text-muted-foreground hover:bg-muted cursor-default',
                ICON_ROW_HEIGHT
              )}
              title={!isOpen ? 'Search' : undefined}
            >
              <Search className="h-5 w-5 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Navigation links — no scroll; fixed list like X/TikTok */}
        <nav
          className={cn(
            'flex flex-shrink-0 flex-col overflow-hidden',
            isOpen ? 'gap-0.5' : 'gap-0'
          )}
        >
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            const isAI = href === '/ai'
            return (
              <Link
                key={href}
                href={href}
                title={!isOpen ? label : undefined}
                className={cn(
                  'group relative flex items-center rounded-xl text-sm font-medium transition-all min-w-0',
                  !isOpen && ICON_ROW_HEIGHT,
                  isOpen ? 'gap-3 px-3 py-2' : 'justify-center w-full px-0',
                  isActive
                    ? isAI
                      ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                      : 'bg-green-700 text-white'
                    : 'text-muted-foreground hover:bg-black/[0.04] hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isAI && isActive ? 'text-green-500' : ''
                  )}
                />
                <span
                  className={cn(
                    'sidebar-label overflow-hidden transition-opacity duration-150 ease',
                    !isOpen ? 'opacity-0 w-0 min-w-0 overflow-hidden pointer-events-none hidden' : 'opacity-100'
                  )}
                >
                  {label}
                </span>
                {isAI && (
                  <span
                    className={cn(
                      'sidebar-label ml-auto text-xs bg-green-500/15 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold overflow-hidden transition-opacity duration-150 ease',
                      !isOpen ? 'opacity-0 w-0 min-w-0 overflow-hidden pointer-events-none hidden' : 'opacity-100'
                    )}
                  >
                    AI
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Floating Post Button — above profile */}
        {isOpen && (
          <div className="flex-shrink-0 py-1">
            <FloatingPostButton onClick={openPostModal} />
          </div>
        )}

        {/* Notifications + Settings */}
        <div
          className={cn(
            'flex flex-col flex-shrink-0 pt-1.5 border-t border-border',
            isOpen ? 'gap-0.5' : 'gap-0'
          )}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'group flex w-full items-center rounded-xl text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground relative min-w-0',
              !isOpen && ICON_ROW_HEIGHT,
              isOpen ? 'gap-3 px-3 py-2' : 'justify-center px-0'
            )}
            title={!isOpen ? 'Notifications' : undefined}
            aria-label="Notifications"
          >
            <span className="relative flex-shrink-0">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && !isOpen && (
                <span
                  className="absolute -top-0.5 -right-0.5 rounded-full bg-green-700 text-white text-xs font-semibold min-w-5 h-5 flex items-center justify-center overflow-hidden"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <span
              className={cn(
                'sidebar-label overflow-hidden transition-opacity duration-150 ease',
                !isOpen ? 'opacity-0 w-0 min-w-0 overflow-hidden pointer-events-none hidden' : 'opacity-100'
              )}
            >
              Notifications
            </span>
            {unreadCount > 0 && isOpen && (
              <span
                className="ml-auto rounded-full bg-green-700 text-white text-xs font-semibold min-w-5 h-5 flex items-center justify-center flex-shrink-0 overflow-hidden"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <Link
            href="/settings"
            title={!isOpen ? 'Settings' : undefined}
            className={cn(
              'group flex items-center rounded-xl text-sm font-medium transition-all min-w-0',
              !isOpen && ICON_ROW_HEIGHT,
              isOpen ? 'gap-3 px-3 py-2' : 'justify-center w-full px-0',
              pathname === '/settings'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                'sidebar-label overflow-hidden transition-opacity duration-150 ease',
                !isOpen ? 'opacity-0 w-0 min-w-0 overflow-hidden pointer-events-none hidden' : 'opacity-100'
              )}
            >
              Settings
            </span>
          </Link>
        </div>

        {/* Spacer to push profile to bottom while keeping Notifications/Settings higher */}
        <div className="flex-1 min-h-0" />

        {/* Profile card at bottom */}
        {isOpen && (
          <ProfileCard
            user={{
              name: currentUser.name,
              handle: currentUser.handle,
              initials: currentUser.avatarInitials,
              color: currentUser.avatarColor,
            }}
            onViewProfile={() => router.push('/profile')}
            onEditProfile={() => router.push('/profile?edit=true')}
            onSignOut={handleSignOut}
          />
        )}
      </div>
      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllNotificationsRead}
        onMarkRead={markNotificationRead}
      />
    </aside>
  )
}
