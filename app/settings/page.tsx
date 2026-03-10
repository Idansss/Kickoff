'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import * as Switch from '@radix-ui/react-switch'
import { userStore } from '@/store/userStore'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor, Check, X } from 'lucide-react'

const ALL_TEAMS = [
  'Arsenal', 'Manchester City', 'Manchester United', 'Liverpool',
  'Chelsea', 'Tottenham', 'Newcastle', 'Aston Villa', 'West Ham',
  'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla',
  'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen',
  'AC Milan', 'Inter Milan', 'Juventus', 'Napoli',
  'PSG', 'Lyon', 'Marseille', 'Monaco',
  'Ajax', 'Porto', 'Benfica', 'Celtic',
  'Brazil', 'Argentina', 'France', 'England', 'Spain', 'Germany',
] as const

function ToggleSwitch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  id: string
}) {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative inline-flex h-6 w-[44px] cursor-pointer items-center rounded-full border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(22,163,74,0.15)] focus-visible:border-[#16a34a]',
        checked
          ? 'bg-[#16a34a] border-[#16a34a]'
          : 'bg-[#e5e7eb] border-[#d1d5db] dark:bg-[#2a2a2a] dark:border-[#3a3a3a]'
      )}
    >
      <Switch.Thumb
        className={cn(
          'pointer-events-none block h-[18px] w-[18px] rounded-full bg-background ring-0',
          'shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform duration-200 ease',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )}
      />
    </Switch.Root>
  )
}

type ThemeOption = 'light' | 'dark' | 'system'

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
]

const SETTING_KEYS = [
  { id: 'private', key: 'privateAccount' as const, label: 'Private Account', desc: 'Only approved followers can see your posts' },
  { id: 'messages', key: 'allowMessages' as const, label: 'Allow Messages', desc: 'Let anyone send you direct messages' },
  { id: 'activity', key: 'activityStatus' as const, label: 'Activity Status', desc: "Show when you're online" },
  { id: 'notif-matches', key: 'matches' as const, label: 'Match Notifications', desc: 'Get notified when your favorite teams play' },
  { id: 'notif-messages', key: 'messages' as const, label: 'Message Notifications', desc: 'Get notified when you receive a message' },
  { id: 'notif-posts', key: 'posts' as const, label: 'Post Notifications', desc: 'Get notified when someone likes or replies to your post' },
]

export default function SettingsPage(): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  const settings = userStore((s) => s.settings)
  const toggleSetting = userStore((s) => s.toggleSetting)
  const currentUser = userStore((s) => s.currentUser)
  const addFavoriteTeam = userStore((s) => s.addFavoriteTeam)
  const removeFavoriteTeam = userStore((s) => s.removeFavoriteTeam)

  const [form, setForm] = useState({
    email: 'alex@example.com',
    username: currentUser?.handle?.replace(/^@+/, '') ?? 'alexturner',
    name: currentUser?.name ?? 'Alex Turner',
    bio: (currentUser?.bio as string | null | undefined) ?? 'Football enthusiast | Manchester supporter',
  })

  const [saved, setSaved] = useState(false)
  const [newTeam, setNewTeam] = useState('')
  const [teamFocused, setTeamFocused] = useState(false)
  const teamBoxRef = useRef<HTMLDivElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTeamFocused(false)
    }
    const onMouseDown = (e: MouseEvent) => {
      if (teamBoxRef.current && !teamBoxRef.current.contains(e.target as Node)) {
        setTeamFocused(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  const handleSave = useCallback((): void => {
    setSaved(true)
    saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000)
  }, [])

  const handleAddTeam = useCallback((): void => {
    const team = newTeam.trim()
    if (team && !currentUser.favoriteTeams.includes(team)) {
      addFavoriteTeam(team)
      setNewTeam('')
      setTeamFocused(false)
    }
  }, [addFavoriteTeam, currentUser.favoriteTeams, newTeam])

  const teamSuggestions = useMemo(() => {
    const q = newTeam.trim().toLowerCase()
    if (!q) return []
    return ALL_TEAMS.filter((t) => t.toLowerCase().includes(q)).slice(0, 5)
  }, [newTeam])

  const canShowTeamDropdown = teamFocused && newTeam.trim().length > 0

  const tryAddExactSingleSuggestion = useCallback((): boolean => {
    const q = newTeam.trim().toLowerCase()
    if (!q) return false
    const exact = teamSuggestions.filter((t) => t.toLowerCase() === q)
    if (exact.length === 1) {
      const team = exact[0]
      if (!currentUser.favoriteTeams.includes(team)) {
        addFavoriteTeam(team)
      }
      setNewTeam('')
      setTeamFocused(false)
      return true
    }
    return false
  }, [addFavoriteTeam, currentUser.favoriteTeams, newTeam, teamSuggestions])

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        {/* Page Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences</p>
        </div>

        <div className="p-4 sm:p-6 space-y-8">
          {/* Account Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Account Settings</h2>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="email"
                  className="text-[11px] font-bold text-[#666666] tracking-[0.5px] uppercase"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={cn(
                    'mt-1 w-full rounded-[8px] px-[14px] py-[10px] text-[14px]',
                    'bg-[#f9f9f9] text-[#0f0f0f] border border-[#e5e7eb] placeholder:text-[#555555]',
                    'dark:bg-[#1a1a1a] dark:text-[#f2f2f2] dark:border-[#2a2a2a]',
                    'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#16a34a] focus-visible:shadow-[0_0_0_2px_rgba(22,163,74,0.15)]',
                    'pr-10 peer'
                  )}
                />
                <span className="pointer-events-none relative -mt-9 float-right mr-3 text-[#444] peer-focus:opacity-0 transition-opacity">
                  ✏️
                </span>
              </div>

              <div>
                <Label
                  htmlFor="username"
                  className="text-[11px] font-bold text-[#666666] tracking-[0.5px] uppercase"
                >
                  Username
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => {
                      const raw = e.target.value
                      const normalized = raw.replace(/^@+/, '').replace(/\s+/g, '')
                      setForm({ ...form, username: normalized })
                    }}
                    className={cn(
                      'pl-8 pr-[14px] w-full rounded-[8px] py-[10px] text-[14px]',
                      'bg-[#f9f9f9] text-[#0f0f0f] border border-[#e5e7eb] placeholder:text-[#555555]',
                      'dark:bg-[#1a1a1a] dark:text-[#f2f2f2] dark:border-[#2a2a2a]',
                      'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#16a34a] focus-visible:shadow-[0_0_0_2px_rgba(22,163,74,0.15)]',
                      'pr-10 peer'
                    )}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#444] peer-focus:opacity-0 transition-opacity">
                    ✏️
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  This is your public handle. It will appear as <span className="font-mono">@{form.username || 'username'}</span> on posts.
                </p>
              </div>

              <div>
                <Label
                  htmlFor="name"
                  className="text-[11px] font-bold text-[#666666] tracking-[0.5px] uppercase"
                >
                  Display Name
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={cn(
                    'mt-1 w-full rounded-[8px] px-[14px] py-[10px] text-[14px]',
                    'bg-[#f9f9f9] text-[#0f0f0f] border border-[#e5e7eb] placeholder:text-[#555555]',
                    'dark:bg-[#1a1a1a] dark:text-[#f2f2f2] dark:border-[#2a2a2a]',
                    'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#16a34a] focus-visible:shadow-[0_0_0_2px_rgba(22,163,74,0.15)]',
                    'pr-10 peer'
                  )}
                />
                <span className="pointer-events-none relative -mt-9 float-right mr-3 text-[#444] peer-focus:opacity-0 transition-opacity">
                  ✏️
                </span>
              </div>

              <div>
                <Label
                  htmlFor="bio"
                  className="text-[11px] font-bold text-[#666666] tracking-[0.5px] uppercase"
                >
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className={cn(
                    'mt-1 w-full rounded-[8px] px-[14px] py-[10px] text-[14px] min-h-[80px] resize-none',
                    'bg-[#f9f9f9] text-[#0f0f0f] border border-[#e5e7eb] placeholder:text-[#555555]',
                    'dark:bg-[#1a1a1a] dark:text-[#f2f2f2] dark:border-[#2a2a2a]',
                    'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#16a34a] focus-visible:shadow-[0_0_0_2px_rgba(22,163,74,0.15)]',
                    'pr-10 peer'
                  )}
                  rows={4}
                />
                <span className="pointer-events-none relative -mt-9 float-right mr-3 text-[#444] peer-focus:opacity-0 transition-opacity">
                  ✏️
                </span>
              </div>

              <div className="flex sm:justify-end">
                <Button
                  onClick={handleSave}
                  className={cn(
                    'transition-colors bg-green-600 hover:bg-green-700 text-white',
                    'w-full sm:w-auto'
                  )}
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Privacy & Notifications from store */}
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-bold">Privacy & Notifications</h2>
            <div className="space-y-0">
              {SETTING_KEYS.map(({ id, key, label, desc }) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-4 py-[14px] border-b border-[#e5e7eb] dark:border-[#1a1a1a]"
                >
                  <div>
                    <div className="text-[14px] font-medium text-[#0f0f0f] dark:text-[#f2f2f2]">
                      {label}
                    </div>
                    <div className="text-xs text-[#6b7280] dark:text-[#666666] mt-0.5">
                      {desc}
                    </div>
                  </div>
                  <ToggleSwitch
                    id={id}
                    checked={settings[key]}
                    onCheckedChange={() => toggleSetting(key)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Favorite Teams */}
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-bold">Favorite Teams</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentUser.favoriteTeams.map((team) => (
                <span
                  key={team}
                  className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 px-3 py-1 text-sm"
                >
                  {team}
                  <button
                    type="button"
                    onClick={() => removeFavoriteTeam(team)}
                    className="rounded-full hover:bg-green-500/30 p-0.5"
                    aria-label={`Remove ${team}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div ref={teamBoxRef} className="relative max-w-xs">
              <Input
                placeholder="Add team name"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                onFocus={() => setTeamFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setTeamFocused(false)
                  if (e.key === 'Enter') {
                    if (tryAddExactSingleSuggestion()) return
                    handleAddTeam()
                  }
                }}
                className="w-full"
                aria-label="Add favorite team"
              />
              {canShowTeamDropdown && (
                <div
                  className="absolute left-0 right-0 z-[200] mt-1.5 overflow-hidden rounded-xl border border-border bg-popover/95 backdrop-blur-[20px]"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
                >
                  <div className="max-h-[220px] overflow-y-auto">
                    {teamSuggestions.map((team) => {
                      const already = currentUser.favoriteTeams.includes(team)
                      return (
                        <button
                          key={team}
                          type="button"
                          disabled={already}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors',
                            already ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted'
                          )}
                          onClick={() => {
                            if (already) return
                            addFavoriteTeam(team)
                            setNewTeam('')
                            setTeamFocused(false)
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span>⚽</span>
                            <span className="font-medium">{team}</span>
                          </span>
                          {already && (
                            <span className="text-xs text-muted-foreground">Already added</span>
                          )}
                        </button>
                      )
                    })}
                    {teamSuggestions.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No teams match &apos;{newTeam.trim()}&apos;
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" onClick={handleAddTeam} disabled={!newTeam.trim()}>
                  Add Team
                </Button>
              </div>
            </div>
          </section>

          {/* Theme Settings */}
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-bold">Appearance</h2>

            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                    (theme === value || (value === 'system' && !theme))
                      ? 'border-green-500 bg-green-500/10 text-green-600'
                      : 'border-border hover:bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="mb-4">
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone. All your posts and data will be permanently deleted.
                </div>
              </div>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
