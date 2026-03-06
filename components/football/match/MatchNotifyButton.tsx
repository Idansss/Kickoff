'use client'

import { useState } from 'react'
import { Bell, BellOff, Mail } from 'lucide-react'
import { toastStore } from '@/store/toastStore'
import { userStore } from '@/store/userStore'

interface Props {
  homeTeam: string
  awayTeam: string
  competition: string
  kickoffTime: string
  matchId: string
}

export function MatchNotifyButton({ homeTeam, awayTeam, competition, kickoffTime, matchId }: Props) {
  const [notified, setNotified] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const currentUser = userStore((s) => s.currentUser)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleNotify = async () => {
    const emailToUse = email.trim() || (currentUser.handle + '@kickoff.football')
    if (!emailToUse.includes('@')) {
      toastStore.getState().showToast({ message: 'Enter a valid email address', duration: 3000 })
      return
    }

    setSending(true)
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'match_alert',
          to: emailToUse,
          userName: currentUser.name,
          homeTeam,
          awayTeam,
          competition,
          kickoffTime,
          matchUrl: `${appUrl}/match/${matchId}`,
        }),
      })
      setNotified(true)
      setEmailOpen(false)
      toastStore.getState().showToast({ message: 'Match alert set!', duration: 3000 })
    } catch {
      toastStore.getState().showToast({ message: 'Failed to set alert', duration: 3000 })
    }
    setSending(false)
  }

  if (notified) {
    return (
      <button
        type="button"
        onClick={() => setNotified(false)}
        className="flex items-center gap-1.5 rounded-full border border-green-500 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600"
      >
        <BellOff className="h-3.5 w-3.5" />
        Notified
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEmailOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-green-500 hover:text-green-600 transition-colors"
      >
        <Bell className="h-3.5 w-3.5" />
        Notify me
      </button>

      {emailOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-xl z-10 p-4">
          <p className="text-sm font-semibold mb-1">Email alert for this match</p>
          <p className="text-xs text-muted-foreground mb-3">{homeTeam} vs {awayTeam}</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/50"
              onKeyDown={(e) => { if (e.key === 'Enter') handleNotify() }}
            />
            <button
              type="button"
              onClick={handleNotify}
              disabled={sending}
              className="rounded-lg bg-green-600 hover:bg-green-700 p-2 text-white disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
