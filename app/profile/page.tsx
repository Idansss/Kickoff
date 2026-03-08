'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { CalendarDays, Camera, Link2, Lock, ImagePlus, X } from 'lucide-react'
import { userStore } from '@/store/userStore'
import { feedStore } from '@/store/feedStore'
import { FeedPostCard } from '@/components/feed/FeedPostCard'
import { cn, scrollToAndHighlight } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useImageUpload } from '@/hooks/useImageUpload'

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
  const [editBio, setEditBio] = useState(currentUser?.bio ?? '')
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(currentUser?.avatarImage ?? null)
  const [editHeaderUrl, setEditHeaderUrl] = useState<string | null>(currentUser?.headerImage ?? null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [pendingHeaderFile, setPendingHeaderFile] = useState<File | null>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { upload: uploadImage } = useImageUpload({ bucket: 'profiles' })

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
      setEditBio(currentUser.bio ?? '')
      setEditAvatarUrl(currentUser.avatarImage ?? null)
      setEditHeaderUrl(currentUser.headerImage ?? null)
    }
  }, [isEditMode, currentUser?.name, currentUser?.handle, currentUser?.bio, currentUser?.avatarImage, currentUser?.headerImage])

  const openEdit = () => router.push('/profile?edit=true')
  const closeEdit = () => router.replace('/profile')

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleHeaderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setPendingHeaderFile(file)
      const url = await readFileAsDataUrl(file)
      setEditHeaderUrl(url)
    }
    e.target.value = ''
  }
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setPendingAvatarFile(file)
      const url = await readFileAsDataUrl(file)
      setEditAvatarUrl(url)
    }
    e.target.value = ''
  }
  const clearEditHeader = () => { setEditHeaderUrl(null); setPendingHeaderFile(null) }
  const clearEditAvatar = () => { setEditAvatarUrl(null); setPendingAvatarFile(null) }

  const saveEdit = async () => {
    if (!currentUser || isSaving) return
    setIsSaving(true)
    const name = editName.trim() || currentUser.name
    const handle = editHandle.trim().replace(/^@/, '') || currentUser.handle
    const parts = name.split(/\s+/).filter(Boolean)
    const avatarInitials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
        : name.slice(0, 2).toUpperCase() || currentUser.avatarInitials

    // Upload new files to Supabase Storage if selected
    const avatarUrl = pendingAvatarFile
      ? (await uploadImage(pendingAvatarFile)) ?? editAvatarUrl
      : editAvatarUrl
    const headerUrl = pendingHeaderFile
      ? (await uploadImage(pendingHeaderFile)) ?? editHeaderUrl
      : editHeaderUrl

    updateCurrentUser({
      name,
      handle,
      avatarInitials,
      bio: editBio.trim() || undefined,
      avatarImage: avatarUrl ?? undefined,
      headerImage: headerUrl ?? undefined,
    })
    setPendingAvatarFile(null)
    setPendingHeaderFile(null)
    setIsSaving(false)
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

  const myPosts = useMemo(
    () => (currentUser ? posts.filter((post) => post.author.id === currentUser.id) : []),
    [currentUser, posts]
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
  const progress = xpProgress(currentUser?.xp ?? 0)

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        {/* Cover / header */}
        <div className="h-40 sm:h-44 relative overflow-hidden bg-gradient-to-br from-green-600/40 via-emerald-500/20 to-teal-500/10">
          {currentUser.headerImage ? (
            <Image
              src={currentUser.headerImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 672px"
              unoptimized={currentUser.headerImage.startsWith('data:')}
            />
          ) : null}
        </div>

        <div className="px-4 sm:px-6 pb-0 border-b border-border">
          <div className="flex items-end justify-between -mt-14 mb-3">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden flex items-center justify-center text-2xl font-bold text-muted-foreground bg-muted shrink-0">
                {currentUser.avatarImage ? (
                  <Image
                    src={currentUser.avatarImage}
                    alt={currentUser.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    unoptimized={currentUser.avatarImage.startsWith('data:')}
                  />
                ) : (
                  <span style={{ backgroundColor: currentUser.avatarColor }} className="w-full h-full flex items-center justify-center text-white">
                    {currentUser.avatarInitials}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <Button variant="outline" size="sm" onClick={openEdit} className="shrink-0">
              Edit Profile
            </Button>
          </div>

          <div className="space-y-1 mb-2">
            <h1 className="text-xl font-bold">{currentUser.name}</h1>
            <p className="text-muted-foreground text-sm">@{currentUser.handle}</p>
          </div>
          {currentUser.bio ? (
            <p className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap">{currentUser.bio}</p>
          ) : null}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Joined March 2024</span>
            </div>
            <div className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              <span className="text-green-700 dark:text-green-400">kickoff.football</span>
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
                  <span className="text-xs font-medium text-gray-900 dark:text-foreground">{b.name}</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={closeEdit}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="edit-profile-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 id="edit-profile-title" className="text-lg font-bold text-foreground">Edit profile</h2>
              <Button size="sm" onClick={saveEdit} disabled={isSaving} className="rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4">
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {/* Cover photo */}
              <div className="px-5 pt-5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cover photo</Label>
                <label
                  htmlFor="edit-cover-file"
                  className={cn(
                    'mt-2 h-32 rounded-xl border-2 border-dashed overflow-hidden transition-colors relative block cursor-pointer',
                    'bg-muted/50 border-muted-foreground/25 hover:border-green-500/50 hover:bg-muted/80 flex items-center justify-center'
                  )}
                >
                  <input
                    id="edit-cover-file"
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Upload cover photo"
                    onChange={handleHeaderChange}
                  />
                  {editHeaderUrl ? (
                    <div className="absolute inset-0 w-full h-full group">
                      <Image
                        src={editHeaderUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={editHeaderUrl.startsWith('data:')}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                        <ImagePlus className="h-6 w-6 text-white" />
                        <span className="text-sm font-medium text-white">Change photo</span>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.preventDefault(); clearEditHeader() }}
                        onKeyDown={(e) => e.key === 'Enter' && clearEditHeader()}
                        className="absolute top-2 right-2 rounded-full bg-foreground/60 p-1.5 text-background hover:bg-foreground/80 focus:outline-none focus:ring-2 focus:ring-green-500"
                        aria-label="Remove cover photo"
                      >
                        <X className="h-4 w-4" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-sm font-medium">Add cover photo</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Profile photo */}
              <div className="px-5 pt-6">
                <Label className="text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-3 block">
                  Profile photo
                </Label>
                <div className="flex flex-wrap items-start gap-5">
                  <label
                    htmlFor="edit-avatar-file"
                    className={cn(
                      'w-28 h-28 rounded-full overflow-hidden cursor-pointer flex items-center justify-center transition-all duration-200 block shrink-0',
                      'border-2 border-dashed border-muted-foreground/20 hover:border-green-500/60',
                      'bg-gradient-to-br from-muted/60 to-muted/30 hover:from-green-500/10 hover:to-green-500/5',
                      'shadow-sm hover:shadow-md ring-2 ring-transparent hover:ring-green-500/20'
                    )}
                  >
                    <input
                      id="edit-avatar-file"
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Upload profile photo"
                      onChange={handleAvatarChange}
                    />
                    {editAvatarUrl ? (
                      <div className="relative w-full h-full group">
                        <Image
                          src={editAvatarUrl}
                          alt=""
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                          unoptimized={editAvatarUrl.startsWith('data:')}
                        />
                        <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="rounded-full bg-background/20 p-2.5 backdrop-blur-sm">
                            <Camera className="h-6 w-6 text-foreground" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="rounded-full bg-muted/80 p-4 text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-colors duration-200">
                        <Camera className="h-8 w-8" strokeWidth={1.5} />
                      </span>
                    )}
                  </label>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Square images work best. Max 5MB. JPG, PNG or WebP.
                    </p>
                    {editAvatarUrl ? (
                      <button
                        type="button"
                        onClick={clearEditAvatar}
                        className="mt-2.5 text-sm text-red-500 hover:text-red-600 font-medium underline underline-offset-2"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Name, Handle, Bio */}
              <div className="px-5 pt-4 pb-6 space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-xs font-medium text-muted-foreground">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 rounded-lg"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-handle" className="text-xs font-medium text-muted-foreground">Handle</Label>
                  <Input
                    id="edit-handle"
                    value={editHandle}
                    onChange={(e) => setEditHandle(e.target.value)}
                    className="mt-1.5 rounded-lg"
                    placeholder="username"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">kickoff.football/@{editHandle || 'username'}</p>
                </div>
                <div>
                  <Label htmlFor="edit-bio" className="text-xs font-medium text-muted-foreground">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="mt-1.5 rounded-lg min-h-[100px] resize-none"
                    placeholder="Tell us about yourself..."
                    maxLength={160}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 text-right">{editBio.length}/160</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end">
              <Button variant="outline" size="sm" onClick={closeEdit} className="rounded-full">Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={isSaving} className="rounded-full ml-2 bg-green-600 hover:bg-green-700 text-white">{isSaving ? 'Saving…' : 'Save changes'}</Button>
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
