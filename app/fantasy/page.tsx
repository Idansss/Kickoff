'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, CheckCircle, Plus } from 'lucide-react'

type League = 'PL' | 'LL' | 'BL' | 'SA' | 'L1'

interface FantasyPlayer {
  id: string
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  team: string
  league: League
  price: number
  points: number
  selected: boolean
  form: number[]
  injuryStatus?: 'fit' | 'doubt' | 'out'
}

const BUDGET = 100

const PLAYER_POOL: FantasyPlayer[] = [
  // ── Premier League ──────────────────────────────────────────
  { id: 'gk1',   name: 'Alisson',            position: 'GK',  team: 'Liverpool',       league: 'PL', price: 5.5,  points: 52,  selected: false, form: [6,8,10,6,9] },
  { id: 'gk2',   name: 'Ederson',             position: 'GK',  team: 'Man City',        league: 'PL', price: 5.5,  points: 48,  selected: false, form: [8,6,6,8,6] },
  { id: 'gk3',   name: 'Raya',                position: 'GK',  team: 'Arsenal',         league: 'PL', price: 5.0,  points: 55,  selected: false, form: [10,6,8,9,6] },
  { id: 'def1',  name: 'Alexander-Arnold',    position: 'DEF', team: 'Liverpool',       league: 'PL', price: 7.5,  points: 78,  selected: false, form: [8,13,6,9,6] },
  { id: 'def2',  name: 'Pedro Porro',         position: 'DEF', team: 'Tottenham',       league: 'PL', price: 5.5,  points: 62,  selected: false, form: [9,6,8,6,6] },
  { id: 'def3',  name: 'Mykolenko',           position: 'DEF', team: 'Everton',         league: 'PL', price: 4.5,  points: 55,  selected: false, form: [8,6,6,6,9] },
  { id: 'def4',  name: 'Gabriel',             position: 'DEF', team: 'Arsenal',         league: 'PL', price: 6.0,  points: 72,  selected: false, form: [10,6,6,8,9] },
  { id: 'def5',  name: 'Saliba',              position: 'DEF', team: 'Arsenal',         league: 'PL', price: 6.0,  points: 68,  selected: false, form: [8,6,9,6,10] },
  { id: 'mid1',  name: 'Salah',               position: 'MID', team: 'Liverpool',       league: 'PL', price: 13.0, points: 142, selected: false, form: [13,18,15,8,12] },
  { id: 'mid2',  name: 'Palmer',              position: 'MID', team: 'Chelsea',         league: 'PL', price: 11.0, points: 125, selected: false, form: [16,12,8,15,13] },
  { id: 'mid3',  name: 'Saka',                position: 'MID', team: 'Arsenal',         league: 'PL', price: 10.0, points: 112, selected: false, form: [12,8,15,9,11] },
  { id: 'mid4',  name: 'Mbeumo',              position: 'MID', team: 'Brentford',       league: 'PL', price: 8.0,  points: 105, selected: false, form: [9,12,8,15,10] },
  { id: 'mid5',  name: 'Diogo Jota',          position: 'MID', team: 'Liverpool',       league: 'PL', price: 8.0,  points: 95,  selected: false, form: [9,6,8,12,11], injuryStatus: 'doubt' },
  { id: 'fwd1',  name: 'Haaland',             position: 'FWD', team: 'Man City',        league: 'PL', price: 14.5, points: 148, selected: false, form: [15,8,12,18,10] },
  { id: 'fwd2',  name: 'Watkins',             position: 'FWD', team: 'Aston Villa',     league: 'PL', price: 9.0,  points: 118, selected: false, form: [12,9,13,8,14] },
  { id: 'fwd3',  name: 'Isak',                position: 'FWD', team: 'Newcastle',       league: 'PL', price: 8.5,  points: 108, selected: false, form: [9,12,8,9,14] },

  // ── La Liga ─────────────────────────────────────────────────
  { id: 'gk4',   name: 'Courtois',            position: 'GK',  team: 'Real Madrid',     league: 'LL', price: 5.5,  points: 50,  selected: false, form: [8,7,9,6,8] },
  { id: 'gk5',   name: 'Ter Stegen',          position: 'GK',  team: 'Barcelona',       league: 'LL', price: 5.0,  points: 45,  selected: false, form: [7,8,6,9,7] },
  { id: 'def6',  name: 'Carvajal',            position: 'DEF', team: 'Real Madrid',     league: 'LL', price: 6.5,  points: 70,  selected: false, form: [9,6,8,7,9] },
  { id: 'def7',  name: 'Kounde',              position: 'DEF', team: 'Barcelona',       league: 'LL', price: 7.0,  points: 74,  selected: false, form: [10,7,8,9,6] },
  { id: 'def8',  name: 'Hermoso',             position: 'DEF', team: 'Atletico Madrid', league: 'LL', price: 5.5,  points: 60,  selected: false, form: [8,7,6,8,9] },
  { id: 'mid6',  name: 'Bellingham',          position: 'MID', team: 'Real Madrid',     league: 'LL', price: 12.0, points: 130, selected: false, form: [14,11,13,10,15] },
  { id: 'mid7',  name: 'Pedri',               position: 'MID', team: 'Barcelona',       league: 'LL', price: 9.5,  points: 108, selected: false, form: [11,9,12,8,13] },
  { id: 'mid8',  name: 'Griezmann',           position: 'MID', team: 'Atletico Madrid', league: 'LL', price: 9.0,  points: 102, selected: false, form: [10,8,11,9,12] },
  { id: 'fwd4',  name: 'Vinicius Jr',         position: 'FWD', team: 'Real Madrid',     league: 'LL', price: 13.5, points: 140, selected: false, form: [15,12,14,11,16] },
  { id: 'fwd5',  name: 'Yamal',               position: 'FWD', team: 'Barcelona',       league: 'LL', price: 10.0, points: 118, selected: false, form: [12,10,13,9,14] },
  { id: 'fwd6',  name: 'Lewandowski',         position: 'FWD', team: 'Barcelona',       league: 'LL', price: 10.5, points: 115, selected: false, form: [13,10,11,12,9] },

  // ── Bundesliga ───────────────────────────────────────────────
  { id: 'gk6',   name: 'Neuer',               position: 'GK',  team: 'Bayern Munich',   league: 'BL', price: 5.0,  points: 44,  selected: false, form: [7,6,8,7,6] },
  { id: 'gk7',   name: 'Flekken',             position: 'GK',  team: 'Bayer Leverkusen',league: 'BL', price: 4.5,  points: 48,  selected: false, form: [8,7,9,6,8] },
  { id: 'def9',  name: 'Davies',              position: 'DEF', team: 'Bayern Munich',   league: 'BL', price: 7.0,  points: 72,  selected: false, form: [9,8,7,10,8] },
  { id: 'def10', name: 'Tah',                 position: 'DEF', team: 'Bayer Leverkusen',league: 'BL', price: 6.0,  points: 65,  selected: false, form: [8,7,9,8,7] },
  { id: 'mid9',  name: 'Musiala',             position: 'MID', team: 'Bayern Munich',   league: 'BL', price: 11.0, points: 120, selected: false, form: [13,10,12,11,14] },
  { id: 'mid10', name: 'Wirtz',               position: 'MID', team: 'Bayer Leverkusen',league: 'BL', price: 10.5, points: 118, selected: false, form: [12,11,13,10,14] },
  { id: 'mid11', name: 'Xhaka',               position: 'MID', team: 'Bayer Leverkusen',league: 'BL', price: 7.5,  points: 90,  selected: false, form: [9,8,10,9,11] },
  { id: 'fwd7',  name: 'Harry Kane',          position: 'FWD', team: 'Bayern Munich',   league: 'BL', price: 13.0, points: 138, selected: false, form: [15,11,13,12,16] },
  { id: 'fwd8',  name: 'Boniface',            position: 'FWD', team: 'Bayer Leverkusen',league: 'BL', price: 9.0,  points: 108, selected: false, form: [11,9,12,10,13] },

  // ── Serie A ──────────────────────────────────────────────────
  { id: 'gk8',   name: 'Maignan',             position: 'GK',  team: 'AC Milan',        league: 'SA', price: 5.0,  points: 50,  selected: false, form: [8,7,9,8,7] },
  { id: 'gk9',   name: 'Sommer',              position: 'GK',  team: 'Inter Milan',     league: 'SA', price: 4.5,  points: 46,  selected: false, form: [7,8,7,9,7] },
  { id: 'def11', name: 'T. Hernandez',        position: 'DEF', team: 'AC Milan',        league: 'SA', price: 7.5,  points: 76,  selected: false, form: [10,8,9,11,8] },
  { id: 'def12', name: 'Bastoni',             position: 'DEF', team: 'Inter Milan',     league: 'SA', price: 6.5,  points: 68,  selected: false, form: [9,8,7,9,8] },
  { id: 'mid12', name: 'Barella',             position: 'MID', team: 'Inter Milan',     league: 'SA', price: 9.0,  points: 105, selected: false, form: [11,10,12,9,13] },
  { id: 'mid13', name: 'Leao',                position: 'MID', team: 'AC Milan',        league: 'SA', price: 9.5,  points: 110, selected: false, form: [12,10,11,9,14] },
  { id: 'mid14', name: 'Zaccagni',            position: 'MID', team: 'Lazio',           league: 'SA', price: 7.5,  points: 88,  selected: false, form: [9,8,10,9,10] },
  { id: 'fwd9',  name: 'Lautaro',             position: 'FWD', team: 'Inter Milan',     league: 'SA', price: 11.5, points: 128, selected: false, form: [14,11,12,13,10] },
  { id: 'fwd10', name: 'Thuram',              position: 'FWD', team: 'Inter Milan',     league: 'SA', price: 9.5,  points: 112, selected: false, form: [12,10,11,13,9] },
  { id: 'fwd11', name: 'Vlahovic',            position: 'FWD', team: 'Juventus',        league: 'SA', price: 9.0,  points: 105, selected: false, form: [11,9,12,10,11] },

  // ── Ligue 1 ──────────────────────────────────────────────────
  { id: 'gk10',  name: 'Donnarumma',          position: 'GK',  team: 'PSG',             league: 'L1', price: 5.5,  points: 52,  selected: false, form: [8,7,9,8,9] },
  { id: 'gk11',  name: 'Mvogo',               position: 'GK',  team: 'Strasbourg',      league: 'L1', price: 4.0,  points: 40,  selected: false, form: [7,6,8,6,7] },
  { id: 'def13', name: 'Hakimi',              position: 'DEF', team: 'PSG',             league: 'L1', price: 7.5,  points: 75,  selected: false, form: [10,9,8,11,9] },
  { id: 'def14', name: 'Mukiele',             position: 'DEF', team: 'PSG',             league: 'L1', price: 5.5,  points: 58,  selected: false, form: [8,7,9,7,8] },
  { id: 'mid15', name: 'Zaire-Emery',         position: 'MID', team: 'PSG',             league: 'L1', price: 8.5,  points: 98,  selected: false, form: [10,9,11,8,12] },
  { id: 'mid16', name: 'Doue',                position: 'MID', team: 'PSG',             league: 'L1', price: 8.0,  points: 92,  selected: false, form: [10,8,9,10,11] },
  { id: 'fwd12', name: 'Barcola',             position: 'FWD', team: 'PSG',             league: 'L1', price: 10.0, points: 115, selected: false, form: [12,11,13,10,14] },
  { id: 'fwd13', name: 'Jonathan David',      position: 'FWD', team: 'Lille',           league: 'L1', price: 9.5,  points: 112, selected: false, form: [13,11,12,10,14] },
  { id: 'fwd14', name: 'Lacazette',           position: 'FWD', team: 'Lyon',            league: 'L1', price: 7.5,  points: 88,  selected: false, form: [10,9,10,8,11] },
]

const LEAGUE_LABELS: Record<League, string> = {
  PL: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
  LL: '🇪🇸 La Liga',
  BL: '🇩🇪 Bundesliga',
  SA: '🇮🇹 Serie A',
  L1: '🇫🇷 Ligue 1',
}

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

function PlayerAvatar({ name, posColor, size = 'md' }: { name: string; posColor: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const dim = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', posColor, dim)}>
      {initials}
    </div>
  )
}

export default function FantasyPage() {
  const [players, setPlayers] = useState<FantasyPlayer[]>(PLAYER_POOL)
  const [activeTab, setActiveTab] = useState<Tab>('squad')
  const [posFilter, setPosFilter] = useState<'all' | 'GK' | 'DEF' | 'MID' | 'FWD'>('all')
  const [leagueFilter, setLeagueFilter] = useState<'all' | League>('all')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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
          }
        } catch {
          // ignore malformed
        }
      }
    }

    fetch('/api/fantasy')
      .then((r) => r.json())
      .then((data: { squad?: { id: string }[] }) => {
        if (!data.squad || data.squad.length === 0) return
        const selectedIds = new Set(data.squad.map((p) => p.id))
        setPlayers((prev) => prev.map((p) => ({ ...p, selected: selectedIds.has(p.id) })))
      })
      .catch(() => {})
  }, [])

  const squad = players.filter((p) => p.selected)
  const budget = BUDGET - squad.reduce((sum, p) => sum + p.price, 0)

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
    (p) => !p.selected
      && (posFilter === 'all' || p.position === posFilter)
      && (leagueFilter === 'all' || p.league === leagueFilter)
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
                type="button"
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
                            className={cn('flex flex-col items-center gap-1 w-16 cursor-pointer', p && 'group')}
                            onClick={() => p && toggle(p.id)}
                          >
                            <div className={cn(
                              'h-10 w-10 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white transition-all',
                              p ? `${POSITION_COLORS[pos]} border-white/50 group-hover:scale-105` : 'bg-white/10 border-dashed border-white/30 text-white/50'
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

              {/* Selected players list */}
              {squad.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selected Players</h3>
                  {squad.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <PlayerAvatar name={p.name} posColor={POSITION_COLORS[p.position]} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.team} · {LEAGUE_LABELS[p.league].split(' ').slice(1).join(' ')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-green-600">{p.points}pts</p>
                        <p className="text-xs text-muted-foreground">£{p.price}m</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="h-7 w-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
              {/* League filter */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">League</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(['all', 'PL', 'LL', 'BL', 'SA', 'L1'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLeagueFilter(l)}
                      className={cn(
                        'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap',
                        leagueFilter === l
                          ? 'bg-green-500 text-white border-green-500'
                          : 'border-border text-muted-foreground hover:border-green-500/50'
                      )}
                    >
                      {l === 'all' ? 'All Leagues' : LEAGUE_LABELS[l].split(' ')[0] + ' ' + LEAGUE_LABELS[l].split(' ').slice(1).join(' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position filter */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Position</p>
                <div className="flex gap-2 overflow-x-auto">
                  {(['all', 'GK', 'DEF', 'MID', 'FWD'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
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
              </div>

              <p className="text-xs text-muted-foreground">{pool.length} players available</p>

              <div className="space-y-2">
                {pool.map((p) => {
                  const addable = canAdd(p)
                  return (
                    <div key={p.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                      <PlayerAvatar name={p.name} posColor={POSITION_COLORS[p.position]} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm">{p.name}</p>
                          {p.injuryStatus === 'doubt' && <span className="text-[10px] bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 rounded px-1">?</span>}
                          {p.injuryStatus === 'out' && <span className="text-[10px] bg-red-500/15 text-red-500 border border-red-500/30 rounded px-1">OUT</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.team} · {p.points}pts</p>
                        <p className="text-[10px] text-muted-foreground/70">{LEAGUE_LABELS[p.league].split(' ').slice(1).join(' ')}</p>
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
                          aria-label={`Add ${p.name}`}
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
                  <div className="text-right">
                    <p className="font-bold text-lg tabular-nums">{entry.isMe ? totalPoints : entry.points}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
