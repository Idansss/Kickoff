'use client'

import { Suspense, useState, useMemo, useRef, useEffect } from 'react'
import { AppLayout } from '@/components/app-layout'
import { cn } from '@/lib/utils'
import { X, Search, ArrowLeftRight, Loader2, ChevronRight } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import { activePlayers, type ActivePlayer } from '@/data/activePlayers'

// ── constants ────────────────────────────────────────────────────────────────
const SLOT_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#d97706']

const POS_STYLE: Record<string, { bg: string; text: string }> = {
  GK:  { bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  DEF: { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  MF:  { bg: 'bg-emerald-500/15',text: 'text-emerald-400' },
  FW:  { bg: 'bg-rose-500/15',   text: 'text-rose-400' },
}

const SUGGESTED = ['Erling Haaland','Kylian Mbappe','Lionel Messi','Cristiano Ronaldo','Jude Bellingham','Mohamed Salah','Vinicius Jr','Lamine Yamal']

const ATTR_LABELS: { key: keyof ActivePlayer['attributes']; label: string; short: string }[] = [
  { key: 'pace',      label: 'Pace',      short: 'PAC' },
  { key: 'shooting',  label: 'Shooting',  short: 'SHO' },
  { key: 'passing',   label: 'Passing',   short: 'PAS' },
  { key: 'dribbling', label: 'Dribbling', short: 'DRI' },
  { key: 'defending', label: 'Defending', short: 'DEF' },
  { key: 'physical',  label: 'Physical',  short: 'PHY' },
]

// ── helper ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── SearchDropdown ────────────────────────────────────────────────────────────
function SearchDropdown({ onSelect, existing }: { onSelect: (p: ActivePlayer) => void; existing: string[] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = useMemo(() => {
    if (q.length < 1) return []
    const qLow = q.toLowerCase()
    return activePlayers
      .filter(p =>
        !existing.includes(p.id) && (
          p.name.toLowerCase().includes(qLow) ||
          p.club.toLowerCase().includes(qLow) ||
          p.nationality.toLowerCase().includes(qLow) ||
          p.position.toLowerCase().includes(qLow)
        )
      )
      .slice(0, 8)
  }, [q, existing])

  const select = (p: ActivePlayer) => {
    onSelect(p)
    setQ('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search any active player by name, club or nationality…"
          className="w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: p.clubColor === '#FDE100' || p.clubColor === '#FEBE00' || p.clubColor === '#F7B5CD' ? '#16a34a' : p.clubColor }}
              >
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.flag} {p.club} · {p.position}</p>
              </div>
              <span className={cn('text-xs px-1.5 py-0.5 rounded font-bold', POS_STYLE[p.positionGroup]?.bg, POS_STYLE[p.positionGroup]?.text)}>
                {p.overallRating}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && q.length > 1 && results.length === 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border bg-background shadow-xl p-4 text-sm text-muted-foreground text-center">
          No active player found for &quot;{q}&quot;
        </div>
      )}
    </div>
  )
}

// ── PlayerCard ────────────────────────────────────────────────────────────────
function PlayerCard({ player, color, onRemove }: { player: ActivePlayer; color: string; onRemove: () => void }) {
  const ps = POS_STYLE[player.positionGroup] ?? POS_STYLE.FW
  const safeColor = ['#FDE100','#FEBE00','#F7B5CD','#C8A84B'].includes(player.clubColor) ? color : player.clubColor

  return (
    <div className="relative rounded-2xl border border-border overflow-hidden bg-card" style={{ borderColor: color + '50' }}>
      {/* color strip */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      {/* remove */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-muted/80 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-10"
        aria-label="Remove player"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="p-3 flex flex-col items-center gap-1.5 text-center">
        {/* avatar with overall rating badge */}
        <div className="relative mt-1">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-base font-bold text-white shadow-md"
            style={{ backgroundColor: safeColor }}
          >
            {initials(player.name)}
          </div>
          <div
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-black text-white"
            style={{ backgroundColor: color }}
          >
            {player.overallRating}
          </div>
        </div>

        {/* name */}
        <p className="font-bold text-sm leading-tight mt-1">{player.name}</p>

        {/* position + group badge */}
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', ps.bg, ps.text)}>
            {player.position}
          </span>
        </div>

        {/* team + nationality */}
        <p className="text-[11px] text-muted-foreground leading-none">{player.club}</p>
        <p className="text-[11px] text-muted-foreground leading-none">{player.flag} {player.nationality}</p>

        {/* age + value */}
        <p className="text-[10px] text-muted-foreground">Age {player.age} · {player.marketValue}</p>

        {/* quick season stats */}
        <div className="flex gap-2.5 text-[11px] mt-0.5 pt-1.5 border-t border-border w-full justify-center">
          <span><span className="font-bold text-foreground">{player.seasonStats.goals}</span> <span className="text-muted-foreground">G</span></span>
          <span><span className="font-bold text-foreground">{player.seasonStats.assists}</span> <span className="text-muted-foreground">A</span></span>
          <span><span className="font-bold text-foreground">{player.seasonStats.appearances}</span> <span className="text-muted-foreground">Apps</span></span>
          <span><span className="font-bold text-foreground">{player.seasonStats.rating.toFixed(1)}</span> <span className="text-muted-foreground">Rat</span></span>
        </div>
      </div>
    </div>
  )
}

// ── AddSlot ───────────────────────────────────────────────────────────────────
function AddSlot() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1.5 min-h-[200px] text-muted-foreground/50">
      <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
        <Search className="h-4 w-4" />
      </div>
      <p className="text-xs">Add player</p>
    </div>
  )
}

// ── AttributeBar ─────────────────────────────────────────────────────────────
function AttributeBar({ label, attrKey, players, colors }: {
  label: string; attrKey: keyof ActivePlayer['attributes']
  players: ActivePlayer[]; colors: string[]
}) {
  const vals = players.map(p => p.attributes[attrKey])
  const max = Math.max(...vals, 1)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className="flex gap-2">
          {vals.map((v, i) => (
            <span key={i} className="text-xs font-bold tabular-nums" style={{ color: colors[i] }}>{v}</span>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        {players.map((p, i) => (
          <div key={p.id} className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(vals[i] / 99) * 100}%`, backgroundColor: colors[i] }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── StatBar ───────────────────────────────────────────────────────────────────
function StatBar({ label, players, getValue, colors, lowerIsBetter = false }: {
  label: string
  players: ActivePlayer[]
  getValue: (p: ActivePlayer) => number
  colors: string[]
  lowerIsBetter?: boolean
}) {
  const vals = players.map(getValue)
  const max = Math.max(...vals, 1)
  const best = lowerIsBetter ? Math.min(...vals) : Math.max(...vals)

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
        <div className="flex-1 space-y-1.5">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(vals[i] / max) * 100}%`, backgroundColor: colors[i] }}
                />
              </div>
              <span
                className={cn('text-xs font-bold tabular-nums w-8 text-right', vals[i] === best && 'brightness-125')}
                style={{ color: colors[i] }}
              >
                {typeof vals[i] === 'number' && vals[i] % 1 !== 0 ? vals[i].toFixed(1) : vals[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
type CompareTab = 'attributes' | 'stats' | 'profile'

function ComparePageInner() {
  const [players, setPlayers] = useState<ActivePlayer[]>([])
  const [tab, setTab] = useState<CompareTab>('attributes')

  const addPlayer = (p: ActivePlayer) => {
    if (players.length >= 4 || players.some(pl => pl.id === p.id)) return
    setPlayers(prev => [...prev, p])
  }
  const removePlayer = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id))

  const colors = SLOT_COLORS.slice(0, players.length)

  // radar data
  const radarData = ATTR_LABELS.map(({ key, short }) => {
    const entry: Record<string, unknown> = { stat: short }
    players.forEach(p => { entry[p.name] = p.attributes[key] })
    return entry
  })

  const suggested = useMemo(() =>
    SUGGESTED.map(name => activePlayers.find(p => p.name === name)).filter(Boolean) as ActivePlayer[],
  [])

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl border-x border-border min-h-screen">
        {/* header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-4 pb-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-green-500" />
            <h1 className="text-xl font-bold">Player Comparison</h1>
            <span className="ml-auto text-xs text-muted-foreground">{activePlayers.length}+ active players</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Compare up to 4 players side by side</p>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-5">
          {/* player grid */}
          <div className={cn(
            'grid gap-3',
            players.length === 0 ? 'grid-cols-2' :
            players.length === 1 ? 'grid-cols-2' :
            players.length === 2 ? 'grid-cols-2' :
            players.length === 3 ? 'grid-cols-3 sm:grid-cols-4' :
            'grid-cols-2 sm:grid-cols-4'
          )}>
            {players.map((p, i) => (
              <PlayerCard key={p.id} player={p} color={SLOT_COLORS[i]} onRemove={() => removePlayer(p.id)} />
            ))}
            {players.length < 4 && Array.from({ length: players.length === 0 ? 2 : 1 }).map((_, i) => (
              <AddSlot key={`slot-${i}`} />
            ))}
          </div>

          {/* search */}
          {players.length < 4 && (
            <SearchDropdown onSelect={addPlayer} existing={players.map(p => p.id)} />
          )}

          {/* suggested players */}
          {players.length < 2 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Popular players</p>
              <div className="flex flex-wrap gap-2">
                {suggested.filter(p => !players.some(pl => pl.id === p.id)).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPlayer(p)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium hover:bg-muted hover:border-green-500/50 transition-colors"
                  >
                    <span>{p.flag}</span>
                    <span>{p.name}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1-player prompt */}
          {players.length === 1 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              Add at least one more player to compare
            </p>
          )}

          {/* comparison */}
          {players.length >= 2 && (
            <div className="space-y-4">
              {/* tab bar */}
              <div className="flex rounded-xl border border-border overflow-hidden">
                {(['attributes', 'stats', 'profile'] as CompareTab[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
                      tab === t ? 'bg-green-600 text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {t === 'attributes' ? 'Attributes' : t === 'stats' ? 'Season Stats' : 'Profile'}
                  </button>
                ))}
              </div>

              {/* player name legend */}
              <div className="flex flex-wrap gap-3">
                {players.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SLOT_COLORS[i] }} />
                    <span className="text-xs font-medium">{p.name}</span>
                  </div>
                ))}
              </div>

              {/* ── ATTRIBUTES TAB ── */}
              {tab === 'attributes' && (
                <div className="space-y-4">
                  {/* radar */}
                  <div className="rounded-2xl border border-border p-4">
                    <h2 className="text-sm font-semibold mb-3">Attribute Radar</h2>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        {players.map((p, i) => (
                          <Radar
                            key={p.id}
                            name={p.name}
                            dataKey={p.name}
                            stroke={SLOT_COLORS[i]}
                            fill={SLOT_COLORS[i]}
                            fillOpacity={0.12}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* attribute bars */}
                  <div className="rounded-2xl border border-border p-4 space-y-4">
                    <h2 className="text-sm font-semibold">Attribute Breakdown</h2>
                    {ATTR_LABELS.map(({ key, label }) => (
                      <AttributeBar key={key} label={label} attrKey={key} players={players} colors={SLOT_COLORS} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── SEASON STATS TAB ── */}
              {tab === 'stats' && (
                <div className="rounded-2xl border border-border p-4 space-y-5">
                  <h2 className="text-sm font-semibold">2025/26 Season Stats</h2>
                  <StatBar label="Goals"        players={players} getValue={p => p.seasonStats.goals}        colors={SLOT_COLORS} />
                  <StatBar label="Assists"      players={players} getValue={p => p.seasonStats.assists}      colors={SLOT_COLORS} />
                  <StatBar label="Appearances"  players={players} getValue={p => p.seasonStats.appearances}  colors={SLOT_COLORS} />
                  <StatBar label="Rating"       players={players} getValue={p => p.seasonStats.rating}       colors={SLOT_COLORS} />
                  <StatBar label="Goal Inv."    players={players} getValue={p => p.seasonStats.goals + p.seasonStats.assists} colors={SLOT_COLORS} />
                  <StatBar label="Yellow Cards" players={players} getValue={p => p.seasonStats.yellowCards}  colors={SLOT_COLORS} lowerIsBetter />
                  <StatBar label="Red Cards"    players={players} getValue={p => p.seasonStats.redCards}     colors={SLOT_COLORS} lowerIsBetter />

                  {/* full table */}
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-3 py-2.5 text-muted-foreground font-semibold">Stat</th>
                          {players.map((p, i) => (
                            <th key={p.id} className="px-3 py-2.5 text-right font-bold" style={{ color: SLOT_COLORS[i] }}>
                              {p.name.split(' ').at(-1)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Appearances', get: (p: ActivePlayer) => p.seasonStats.appearances },
                          { label: 'Goals',       get: (p: ActivePlayer) => p.seasonStats.goals },
                          { label: 'Assists',     get: (p: ActivePlayer) => p.seasonStats.assists },
                          { label: 'Goal Involvements', get: (p: ActivePlayer) => p.seasonStats.goals + p.seasonStats.assists },
                          { label: 'Yellow Cards', get: (p: ActivePlayer) => p.seasonStats.yellowCards, lowerBetter: true },
                          { label: 'Red Cards',    get: (p: ActivePlayer) => p.seasonStats.redCards,    lowerBetter: true },
                          { label: 'Avg Rating',  get: (p: ActivePlayer) => p.seasonStats.rating },
                        ].map(({ label, get, lowerBetter }) => {
                          const vals = players.map(get)
                          const best = lowerBetter ? Math.min(...vals) : Math.max(...vals)
                          return (
                            <tr key={label} className="border-b border-border last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-2 text-muted-foreground">{label}</td>
                              {players.map((p, i) => {
                                const v = get(p)
                                const isBest = v === best
                                return (
                                  <td
                                    key={p.id}
                                    className={cn('px-3 py-2 text-right font-bold tabular-nums', isBest && 'text-green-500')}
                                  >
                                    {typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : v}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── PROFILE TAB ── */}
              {tab === 'profile' && (
                <div className="rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-3 text-muted-foreground font-semibold">Info</th>
                        {players.map((p, i) => (
                          <th key={p.id} className="px-3 py-3 text-right font-bold" style={{ color: SLOT_COLORS[i] }}>
                            {p.name.split(' ').at(-1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Full Name',    get: (p: ActivePlayer) => p.name },
                        { label: 'Club',         get: (p: ActivePlayer) => p.club },
                        { label: 'Nationality',  get: (p: ActivePlayer) => `${p.flag} ${p.nationality}` },
                        { label: 'Age',          get: (p: ActivePlayer) => p.age },
                        { label: 'Position',     get: (p: ActivePlayer) => p.position },
                        { label: 'Market Value', get: (p: ActivePlayer) => p.marketValue },
                        { label: 'Overall',      get: (p: ActivePlayer) => p.overallRating },
                        { label: 'Best Attr.',   get: (p: ActivePlayer) => {
                          const attrs = p.attributes
                          const best = Object.entries(attrs).sort(([,a],[,b]) => b - a)[0]
                          return `${best[0].charAt(0).toUpperCase() + best[0].slice(1)} (${best[1]})`
                        }},
                      ].map(({ label, get }) => (
                        <tr key={label} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2.5 text-muted-foreground font-medium">{label}</td>
                          {players.map((p) => (
                            <td key={p.id} className="px-3 py-2.5 text-right font-medium">{String(get(p))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* empty state */}
          {players.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <ArrowLeftRight className="h-10 w-10 text-muted-foreground/20" />
              <p className="font-medium text-muted-foreground text-sm">Search for players above or pick from suggestions</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <ComparePageInner />
    </Suspense>
  )
}
