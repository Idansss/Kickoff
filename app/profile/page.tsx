'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { CalendarDays, Link2, Lock } from 'lucide-react'
import { userStore } from '@/store/userStore'
import { feedStore } from '@/store/feedStore'
import { FeedPostCard } from '@/components/feed/FeedPostCard'
import { cn, scrollToAndHighlight } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Grassroots',
  2: 'Sunday League',
  3: 'Semi-Pro',
  4: 'Professional',
  5: 'Legend',
}

const XP_THRESHOLDS = [0, 200, 500, 1000, 2000]

type Tab = 'posts' | 'bookmarks'

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function xpProgress(xp: number): { current: number; next: number; pct: number } {
  let next = 200
  for (let i = 0; i < XP_THRESHOLDS.length - 1; i++) {
    if (xp < XP_THRESHOLDS[i + 1]) {
      next = XP_THRESHOLDS[i + 1]
      const current = XP_THRESHOLDS[i]
      const pct = ((xp - current) / (next - current)) * 100
      return { current, next, pct }
    }
  }
  return { current: 2000, next: 2000, pct: 100 }
}

function ProfilePageContent(): React.JSX.Element {
  const router = useRouter()
  const currentUser = userStore((s) => s.currentUser)
  const updateCurrentUser = userStore((s) => s.updateCurrentUser)
  const posts = feedStore((s) => s.posts)
  const bookmarks = feedStore((s) => s.bookmarks)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const searchParams = useSearchParams()
  const focusBadgeId = searchParams.get('badge') ?? ''
  const profileTab = searchParams.get('tab') ?? ''
  const isEditMode = searchParams.get('edit') === 'true'
  const [editName, setEditName] = useState(currentUser?.name ?? '')
  const [editHandle, setEditHandle] = useState(currentUser?.handle ?? '')

  useEffect(() => {
    if (!currentUser) {
      router.replace('/feed')
      return
    }
  }, [currentUser, router])

  useEffect(() => {
    if (isEditMode && currentUser) {
      setEditName(currentUser.name)
      setEditHandle(currentUser.handle)
    }
  }, [isEditMode, currentUser?.name, currentUser?.handle])

  const openEdit = () => router.push('/profile?edit=true')
  const closeEdit = () => router.replace('/profile')
  const saveEdit = () => {
    const name = editName.trim() || currentUser.name
    const handle = editHandle.trim().replace(/^@/, '') || currentUser.handle
    const parts = name.split(/\s+/).filter(Boolean)
    const avatarInitials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
        : name.slice(0, 2).toUpperCase() || currentUser.avatarInitials
    updateCurrentUser({ name, handle, avatarInitials })
    closeEdit()
  }

  useEffect(() => {
    if (profileTab === 'badges') {
      scrollToAndHighlight('profile-badges', '#16a34a')
    }
    if (profileTab === 'achievements') {
      scrollToAndHighlight('profile-achievements', '#16a34a')
    }
  }, [profileTab])

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </AppLayout>
    )
  }

  const myPosts = useMemo(
    () => posts.filter((post) => post.author.id === currentUser.id),
    [currentUser.id, posts]
  )
  const tabs = useMemo<{ key: Tab; label: string; count: number }[]>(
    () => [
      { key: 'posts', label: 'My Posts', count: myPosts.length },
      { key: 'bookmarks', label: 'Bookmarks', count: bookmarks.length },
    ],
    [bookmarks.length, myPosts.length]
  )
  const displayedPosts = useMemo(
    () => (activeTab === 'posts' ? myPosts : bookmarks),
    [activeTab, bookmarks, myPosts]
  )
  const progress = xpProgress(currentUser.xp)

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="h-36 bg-gradient-to-br from-green-600/40 via-emerald-500/20 to-teal-500/10" />

        <div className="px-4 sm:px-6 pb-0 border-b border-border">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              <div
                className="h-20 w-20 rounded-full border-4 border-background flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <Button variant="outline" size="sm" onClick={openEdit}>
              Edit Profile
            </Button>
          </div>

          <div className="space-y-1 mb-3">
            <h1 className="text-xl font-bold">{currentUser.name}</h1>
            <p className="text-muted-foreground text-sm">@{currentUser.handle}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Joined March 2024</span>
            </div>
            <div className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              <span className="text-green-600">kickoff.football</span>
            </div>
          </div>

          <div className="flex gap-4 text-sm mb-2">
            <div>
              <span className="font-bold text-foreground">{formatNumber(currentUser.following)}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div>
              <span className="font-bold text-foreground">{formatNumber(currentUser.followers)}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-muted-foreground">
                {LEVEL_NAMES[currentUser.level] ?? 'Grassroots'} · {currentUser.xp} XP
              </span>
              <span className="text-muted-foreground">
                {currentUser.xp < 2000 ? `${progress.next} XP to next` : 'Max'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="text-muted-foreground">Streak:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs',
                    day <= currentUser.streak ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div id="profile-achievements" className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Badges</p>
            <div id="profile-badges" className="flex flex-wrap gap-2">
              {currentUser.badges.map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    'rounded-lg border border-border p-2 flex items-center gap-2',
                    b.earned ? 'opacity-100' : 'opacity-40',
                    focusBadgeId && b.id === focusBadgeId && 'border-green-500 bg-green-500/10'
                  )}
                  title={b.description}
                >
                  <span>{b.emoji}</span>
                  <span className="text-xs font-medium">{b.name}</span>
                  {!b.earned && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex border-b -mx-4 sm:-mx-6 px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-green-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'text-xs rounded-full px-1.5 py-0.5',
                    activeTab === tab.key
                      ? 'bg-green-500/15 text-green-600'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          {displayedPosts.length > 0 ? (
            displayedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-3xl">⚽</div>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'posts' ? 'No posts yet' : 'No bookmarks yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeEdit}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="edit-profile-title"
          >
            <h2 id="edit-profile-title" className="text-lg font-semibold mb-3">Edit profile</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-name" className="text-xs text-muted-foreground">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="edit-handle" className="text-xs text-muted-foreground">Handle</Label>
                <Input
                  id="edit-handle"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="mt-1"
                  placeholder="@username"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={closeEdit}>Cancel</Button>
              <Button size="sm" onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default function ProfilePage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  )
}
