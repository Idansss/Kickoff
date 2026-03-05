'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

interface NotificationTogglesProps {
  teamId: string
}

type PrefKeys = 'matchStart' | 'goals' | 'redCards' | 'finalScore' | 'transfers'

type PrefState = Record<PrefKeys, boolean>

const DEFAULT_PREFS: PrefState = {
  matchStart: true,
  goals: true,
  redCards: true,
  finalScore: true,
  transfers: false,
}

export function NotificationToggles({ teamId }: NotificationTogglesProps) {
  const [prefs, setPrefs] = useState<PrefState>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<PrefKeys | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPrefs() {
      try {
        const res = await fetch(`/api/notification-prefs?teamId=${encodeURIComponent(teamId)}`)
        if (!res.ok) throw new Error('Failed to load')
        const json = (await res.json()) as {
          matchStart?: boolean
          goals?: boolean
          redCards?: boolean
          finalScore?: boolean
          transfers?: boolean
        }
        if (cancelled) return
        setPrefs({
          matchStart: json.matchStart ?? DEFAULT_PREFS.matchStart,
          goals: json.goals ?? DEFAULT_PREFS.goals,
          redCards: json.redCards ?? DEFAULT_PREFS.redCards,
          finalScore: json.finalScore ?? DEFAULT_PREFS.finalScore,
          transfers: json.transfers ?? DEFAULT_PREFS.transfers,
        })
      } catch {
        if (!cancelled) {
          setPrefs(DEFAULT_PREFS)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (teamId) {
      void loadPrefs()
    } else {
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [teamId])

  const handleToggle = (key: PrefKeys) => {
    const nextValue = !prefs[key]
    setPrefs((prev) => ({ ...prev, [key]: nextValue }))
    setSavingKey(key)

    void fetch('/api/notification-prefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        ...prefs,
        [key]: nextValue,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to save')
        }
      })
      .catch(() => {
        setPrefs((prev) => ({ ...prev, [key]: !nextValue }))
      })
      .finally(() => {
        setSavingKey((current) => (current === key ? null : current))
      })
  }

  const items: { key: PrefKeys; label: string }[] = [
    { key: 'matchStart', label: 'Match start' },
    { key: 'goals', label: 'Goals' },
    { key: 'redCards', label: 'Red cards' },
    { key: 'finalScore', label: 'Full time result' },
    { key: 'transfers', label: 'Transfers' },
  ]

  return (
    <section className="rounded-xl border bg-card p-3 text-xs sm:text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-semibold">Notifications</span>
        </div>
        {loading && <span className="text-[11px] text-muted-foreground">Loading…</span>}
      </div>
      <div className="grid gap-1.5">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleToggle(item.key)}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-muted/60"
          >
            <span>{item.label}</span>
            <span
              className={`inline-flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors ${
                prefs[item.key] ? 'bg-emerald-500/80 border-emerald-500' : 'bg-muted border-border'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                  prefs[item.key] ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        ))}
        {savingKey && (
          <span className="mt-1 text-[11px] text-muted-foreground">
            Saving {items.find((i) => i.key === savingKey)?.label.toLowerCase()}…
          </span>
        )}
      </div>
    </section>
  )
}

