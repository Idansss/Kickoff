'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, Star, Users, TrendingUp, ChevronRight, Lock, CheckCircle, Plus, Minus } from 'lucide-react'

interface FantasyPlayer {
  id: string
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  team: string
  price: number
  points: number
  selected: boolean
  form: number[]
  injuryStatus?: 'fit' | 'doubt' | 'out'
}

const BUDGET = 100

const PLAYER_POOL: FantasyPlayer[] = [
  // GKs
  { id: 'gk1', name: 'Alisson', position: 'GK', team: 'Liverpool', price: 5.5, points: 52, selected: false, form: [6,8,10,6,9] },
  { id: 'gk2', name: 'Ederson', position: 'GK', team: 'Man City', price: 5.5, points: 48, selected: false, form: [8,6,6,8,6] },
  { id: 'gk3', name: 'Raya', position: 'GK', team: 'Arsenal', price: 5.0, points: 55, selected: false, form: [10,6,8,9,6] },
  // DEFs
  { id: 'def1', name: 'Alexander-Arnold', position: 'DEF', team: 'Liverpool', price: 7.5, points: 78, selected: false, form: [8,13,6,9,6] },
  { id: 'def2', name: 'Pedro Porro', position: 'DEF', team: 'Tottenham', price: 5.5, points: 62, selected: false, form: [9,6,8,6,6] },
  { id: 'def3', name: 'Mykolenko', position: 'DEF', team: 'Everton', price: 4.5, points: 55, selected: false, form: [8,6,6,6,9] },
  { id: 'def4', name: 'Gabriel', position: 'DEF', team: 'Arsenal', price: 6.0, points: 72, selected: false, form: [10,6,6,8,9] },
  { id: 'def5', name: 'Saliba', position: 'DEF', team: 'Arsenal', price: 6.0, points: 68, selected: false, form: [8,6,9,6,10] },
  // MIDs
  { id: 'mid1', name: 'Salah', position: 'MID', team: 'Liverpool', price: 13.0, points: 142, selected: false, form: [13,18,15,8,12] },
  { id: 'mid2', name: 'Palmer', position: 'MID', team: 'Chelsea', price: 11.0, points: 125, selected: false, form: [16,12,8,15,13] },
  { id: 'mid3', name: 'Saka', position: 'MID', team: 'Arsenal', price: 10.0, points: 112, selected: false, form: [12,8,15,9,11] },
  { id: 'mid4', name: 'Mbeumo', position: 'MID', team: 'Brentford', price: 8.0, points: 105, selected: false, form: [9,12,8,15,10] },
  { id: 'mid5', name: 'Diogo Jota', position: 'MID', team: 'Liverpool', price: 8.0, points: 95, selected: false, form: [9,6,8,12,11], injuryStatus: 'doubt' },
  // FWDs
  { id: 'fwd1', name: 'Haaland', position: 'FWD', team: 'Man City', price: 14.5, points: 148, selected: false, form: [15,8,12,18,10] },
  { id: 'fwd2', name: 'Watkins', position: 'FWD', team: 'Aston Villa', price: 9.0, points: 118, selected: false, form: [12,9,13,8,14] },
  { id: 'fwd3', name: 'Isak', position: 'FWD', team: 'Newcastle', price: 8.5, points: 108, selected: false, form: [9,12,8,9,14] },
]

const FORMATION = { GK: 1, DEF: 4, MID: 4, FWD: 2 }
const POSITION_ORDER: Array<'GK' | 'DEF' | 'MID' | 'FWD'> = ['GK', 'DEF', 'MID', 'FWD']
const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-yellow-500',
  DEF: 'bg-blue-500',
  MID: 'bg-green-500',
  FWD: 'bg-red-500',
}

const LEADERBOARD = [
  { rank: 1, name: 'Alex Turner', points: 1842, badge: '🥇' },
  { rank: 2, name: 'Fabrizio Romano', points: 1798, badge: '🥈' },
  { rank: 3, name: 'OptaJoe', points: 1745, badge: '🥉' },
  { rank: 4, name: 'You', points: 1201, badge: '⚽', isMe: true },
  { rank: 5, name: 'TheAthletic', points: 1188, badge: '🎯' },
]

type Tab = 'squad' | 'leaderboard' | 'transfers'

export default function FantasyPage() {
  const [players, setPlayers] = useState<FantasyPlayer[]>(PLAYER_POOL)
  const [activeTab, setActiveTab] = useState<Tab>('squad')
  const [posFilter, setPosFilter] = useState<'all' | 'GK' | 'DEF' | 'MID' | 'FWD'>('all')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initialized = useRef(false)

  // Load persisted squad (localStorage first, then API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('kickoff-fantasy-squad')
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { ids?: string[] }
          const ids = new Set(parsed.ids ?? [])
          if (ids.size > 0) {
            setPlayers((prev) => prev.map((p) => ({ ...p, selected: ids.has(p.id) })))
            initialized.current = true
          }
        } catch {
          // ignore malformed local storage
        }
      }
    }

    fetch('/api/fantasy')
      .then((r) => r.json())
      .then((data: { squad?: { id: string }[] }) => {
        if (!data.squad || data.squad.length === 0) return
        const selectedIds = new Set(data.squad.map((p) => p.id))
        setPlayers((prev) => prev.map((p) => ({ ...p, selected: selectedIds.has(p.id) })))
        initialized.current = true
      })
      .catch(() => {})
  }, [])

  const squad = players.filter((p) => p.selected)
  const budget = BUDGET - squad.reduce((sum, p) => sum + p.price, 0)

  // Debounced auto-save (API + localStorage)
  const persistSquad = useCallback((squadPlayers: FantasyPlayer[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const payload = {
        squad: squadPlayers.map((p) => ({ id: p.id, name: p.name })),
        budget: BUDGET - squadPlayers.reduce((s, p) => s + p.price, 0),
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'kickoff-fantasy-squad',
          JSON.stringify({ ids: squadPlayers.map((p) => p.id) })
        )
      }
      fetch('/api/fantasy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }, 800)
  }, [])

  const posCount = (pos: FantasyPlayer['position']) => squad.filter((p) => p.position === pos).length

  const canAdd = (p: FantasyPlayer) => {
    if (p.selected) return false
    if (posCount(p.position) >= FORMATION[p.position]) return false
    if (budget < p.price) return false
    if (squad.length >= 11) return false
    return true
  }

  const toggle = (id: string) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
      persistSquad(next.filter((p) => p.selected))
      return next
    })
  }

  const totalPoints = squad.reduce((sum, p) => sum + p.points, 0)
  const squadComplete = squad.length === 11

  const pool = players.filter(
    (p) => !p.selected && (posFilter === 'all' || p.position === posFilter)
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'squad', label: 'My Squad' },
    { key: 'transfers', label: 'Transfers' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 pt-4 pb-0 sm:px-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Fantasy Football</h1>
              <p className="text-xs text-muted-foreground">Gameweek 29 · Deadline: Sat 12:00</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Total points</p>
            </div>
          </div>

          {/* Budget bar */}
          <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget remaining</span>
            <span className={cn('font-bold tabular-nums', budget < 0 ? 'text-red-500' : 'text-green-600')}>
              £{budget.toFixed(1)}m
            </span>
          </div>

          <div className="flex -mb-px">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === t.key
                    ? 'border-green-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4">
          {activeTab === 'squad' && (
            <div className="space-y-6">
              {/* Pitch layout */}
              <div className="rounded-2xl bg-gradient-to-b from-green-700/20 to-green-600/10 border border-green-500/20 p-4 space-y-4">
                <div className="text-center text-xs font-semibold text-green-700 uppercase tracking-widest mb-2">
                  4-4-2 Formation
                </div>
                {POSITION_ORDER.map((pos) => {
                  const posPlayers = squad.filter((p) => p.position === pos)
                  const slots = FORMATION[pos]
                  return (
                    <div key={pos} className="flex justify-center gap-3 flex-wrap">
                      {Array.from({ length: slots }).map((_, i) => {
                        const p = posPlayers[i]
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex flex-col items-center gap-1 w-16 cursor-pointer',
                              p && 'group'
                            )}
                            onClick={() => p && toggle(p.id)}
                          >
                            <div className={cn(
                              'h-10 w-10 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white transition-all',
                              p ? `${POSITION_COLORS[pos]} border-white/50 group-hover:scale-105` : 'bg-white/10 border-dashed border-white/30'
                            )}>
                              {p ? p.name.split(' ').slice(-1)[0].slice(0, 4) : '+'}
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-semibold leading-tight text-foreground">{p?.name.split(' ').slice(-1)[0] ?? pos}</p>
                              {p && <p className="text-[9px] text-green-600 font-bold">{p.points}pts</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Squad slots summary */}
              <div className="grid grid-cols-4 gap-2">
                {POSITION_ORDER.map((pos) => (
                  <div key={pos} className="rounded-lg border border-border p-2 text-center">
                    <div className={cn('text-xs font-bold text-white rounded px-1.5 py-0.5 inline-block mb-1', POSITION_COLORS[pos])}>
                      {pos}
                    </div>
                    <p className={cn('text-sm font-bold', posCount(pos) === FORMATION[pos] ? 'text-green-600' : 'text-foreground')}>
                      {posCount(pos)}/{FORMATION[pos]}
                    </p>
                  </div>
                ))}
              </div>

              {squadComplete && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-600 text-sm">Squad complete!</p>
                    <p className="text-xs text-muted-foreground">Save your team before the deadline</p>
                  </div>
                  <Button
                    size="sm"
                    className="ml-auto bg-green-600 hover:bg-green-700 text-white shrink-0"
                    onClick={() => persistSquad(squad)}
                  >
                    Save Team
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfers' && (
            <div className="space-y-4">
              {/* Position filter */}
              <div className="flex gap-2 overflow-x-auto">
                {(['all', 'GK', 'DEF', 'MID', 'FWD'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosFilter(p)}
                    className={cn(
                      'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap',
                      posFilter === p
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-border text-muted-foreground hover:border-green-500/50'
                    )}
                  >
                    {p === 'all' ? 'All' : p}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {pool.map((p) => {
                  const addable = canAdd(p)
                  return (
                    <div key={p.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                      <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', POSITION_COLORS[p.position])}>
                        {p.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm">{p.name}</p>
                          {p.injuryStatus === 'doubt' && <span className="text-[10px] bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 rounded px-1">?</span>}
                          {p.injuryStatus === 'out' && <span className="text-[10px] bg-red-500/15 text-red-500 border border-red-500/30 rounded px-1">OUT</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.team} · {p.points}pts</p>
                        {/* Form dots */}
                        <div className="flex gap-1 mt-1">
                          {p.form.map((v, i) => (
                            <div key={i} className={cn('h-1.5 w-4 rounded-full', v >= 10 ? 'bg-green-500' : v >= 7 ? 'bg-yellow-500' : 'bg-red-500')} />
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">£{p.price}m</p>
                        <button
                          type="button"
                          onClick={() => addable && toggle(p.id)}
                          disabled={!addable}
                          className={cn(
                            'mt-1 h-7 w-7 rounded-full flex items-center justify-center transition-colors',
                            addable
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          )}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground">Overall Leaderboard</h2>
              {LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    'rounded-xl border p-4 flex items-center gap-3',
                    entry.isMe ? 'border-green-500/50 bg-green-500/5' : 'border-border'
                  )}
                >
                  <span className="text-xl shrink-0">{entry.badge}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm', entry.isMe && 'text-green-600')}>{entry.name}</p>
                    <p className="text-xs text-muted-foreground">Rank #{entry.rank}</p>
                  </div>
                  <p className="font-bold text-lg tabular-nums">{entry.points}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
