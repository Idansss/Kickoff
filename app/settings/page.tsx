'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
        'relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-green-500' : 'bg-input'
      )}
    >
      <Switch.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
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
    username: 'alexturner',
    name: 'Alex Turner',
    bio: 'Football enthusiast | Manchester supporter',
  })

  const [saved, setSaved] = useState(false)
  const [newTeam, setNewTeam] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    },
    []
  )

  const handleSave = useCallback((): void => {
    setSaved(true)
    saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000)
  }, [])

  const handleAddTeam = useCallback((): void => {
    const team = newTeam.trim()
    if (team && !currentUser.favoriteTeams.includes(team)) {
      addFavoriteTeam(team)
      setNewTeam('')
    }
  }, [addFavoriteTeam, currentUser.favoriteTeams, newTeam])

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                className={cn(
                  'transition-colors',
                  saved ? 'bg-green-500 hover:bg-green-500 text-white' : ''
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
          </section>

          {/* Privacy & Notifications from store */}
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-bold">Privacy & Notifications</h2>
            <div className="space-y-3">
              {SETTING_KEYS.map(({ id, key, label, desc }) => (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-xl border border-border p-4"
                >
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
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
            <div className="flex gap-2">
              <Input
                placeholder="Add team name"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                className="max-w-xs"
                aria-label="Add favorite team"
              />
              <Button type="button" size="sm" onClick={handleAddTeam} disabled={!newTeam.trim()}>
                Add Team
              </Button>
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
