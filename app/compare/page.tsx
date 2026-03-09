'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, Plus, Search, Loader2, ArrowLeftRight } from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { mockPlayers } from '@/data/mockData'

interface PlayerOption {
  id: string
  name: string
  position?: string | null
  nationality?: string | null
  photoUrl?: string | null
  currentTeam?: { name: string } | null
}

interface PlayerStats {
  id: string
  name: string
  position?: string | null
  nationality?: string | null
  currentTeam?: { name: string } | null
  stats: {
    appearances: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    minutesPlayed: number
    rating?: number
  }
}

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#d97706']

function SearchDropdown({
  onSelect,
  placeholder,
}: {
  onSelect: (p: PlayerOption) => void
  placeholder: string
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<PlayerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (q.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=players`)
        if (res.ok) {
          const data = await res.json() as { players?: PlayerOption[] }
          if (data.players && data.players.length > 0) {
            setResults(data.players)
            setOpen(true)
            return
          }
        }
      } catch {
        // swallow and fall back to mock players
      } finally {
        setLoading(false)
      }

      // Fallback: local mock players search
      const qLower = q.toLowerCase()
      const fallback = mockPlayers.filter((p) =>
        p.name.toLowerCase().includes(qLower) ||
        p.club.toLowerCase().includes(qLower) ||
        (p.position ?? '').toLowerCase().includes(qLower)
      ).slice(0, 8)

      const mapped: PlayerOption[] = fallback.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        nationality: p.nationality,
        photoUrl: undefined,
        currentTeam: { name: p.club },
      }))

      setResults(mapped)
      setOpen(mapped.length > 0)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); setQ(''); setOpen(false); setResults([]) }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
            >
              <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-xs shrink-0">
                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[p.position, p.currentTeam?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, a, b, higherIsBetter = true }: { label: string; a: number; b: number; higherIsBetter?: boolean }) {
  const aWins = higherIsBetter ? a >= b : a <= b
  const bWins = higherIsBetter ? b >= a : b <= a
  const total = a + b
  const aPct = total === 0 ? 50 : Math.round((a / total) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={cn('font-semibold tabular-nums', aWins && a !== b ? 'text-green-600' : 'text-foreground')}>{a}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('font-semibold tabular-nums', bWins && a !== b ? 'text-blue-600' : 'text-foreground')}>{b}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${aPct}%` }} />
        <div className="h-full bg-blue-500 transition-all flex-1" />
      </div>
    </div>
  )
}

// Generate mock stats for a player based on their DB data
function generateStats(p: PlayerOption): PlayerStats {
  const seed = p.id.charCodeAt(0) + (p.id.charCodeAt(1) || 0)
  return {
    ...p,
    stats: {
      appearances: 20 + (seed % 18),
      goals: seed % 20,
      assists: seed % 15,
      yellowCards: seed % 6,
      redCards: seed % 2,
      minutesPlayed: (20 + seed % 18) * (70 + seed % 20),
      rating: 6.5 + (seed % 25) / 10,
    },
  }
}

function ComparePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState<PlayerStats[]>([])

  const addPlayer = (p: PlayerOption) => {
    if (players.length >= 4) return
    if (players.some((pl) => pl.id === p.id)) return
    setPlayers((prev) => [...prev, generateStats(p)])
  }

  const removePlayer = (id: string) => setPlayers((prev) => prev.filter((p) => p.id !== id))

  const radarData = [
    { stat: 'Goals', ...Object.fromEntries(players.map(p => [p.name, Math.min(p.stats.goals, 30)])) },
    { stat: 'Assists', ...Object.fromEntries(players.map(p => [p.name, Math.min(p.stats.assists, 20)])) },
    { stat: 'Appearances', ...Object.fromEntries(players.map(p => [p.name, Math.min(p.stats.appearances, 40)])) },
    { stat: 'Rating', ...Object.fromEntries(players.map(p => [p.name, Math.round((p.stats.rating ?? 6) * 10)])) },
    { stat: 'Minutes', ...Object.fromEntries(players.map(p => [p.name, Math.min(Math.round(p.stats.minutesPlayed / 100), 30)])) },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl border-x border-border min-h-screen">
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 pt-4 pb-4 sm:px-6">
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="h-5 w-5 text-green-500" />
            <h1 className="text-xl font-bold">Player Comparison</h1>
          </div>
          <p className="text-sm text-muted-foreground">Compare up to 4 players side by side</p>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {/* Player slots */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {players.map((p, i) => (
              <div key={p.id} className="relative rounded-xl border-2 p-3 text-center space-y-1" style={{ borderColor: COLORS[i] + '60' }}>
                <button
                  type="button"
                  onClick={() => removePlayer(p.id)}
                  className="absolute top-2 right-2 rounded-full h-5 w-5 flex items-center justify-center bg-muted hover:bg-red-500 hover:text-white transition-colors"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="mx-auto h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: COLORS[i] }}>
                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <p className="font-semibold text-sm leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.position ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{p.currentTeam?.name ?? '—'}</p>
              </div>
            ))}
            {players.length < 4 && (
              <div className="rounded-xl border-2 border-dashed border-border p-3 flex flex-col items-center justify-center gap-2 min-h-[120px] col-span-1">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Add player</p>
              </div>
            )}
          </div>

          {/* Search */}
          {players.length < 4 && (
            <SearchDropdown onSelect={addPlayer} placeholder="Search a player to add…" />
          )}

          {players.length >= 2 && (
            <>
              {/* Radar chart */}
              <div className="rounded-2xl border border-border p-4">
                <h2 className="font-semibold text-sm mb-4">Performance Radar</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12 }} />
                    {players.map((p, i) => (
                      <Radar
                        key={p.id}
                        name={p.name}
                        dataKey={p.name}
                        stroke={COLORS[i]}
                        fill={COLORS[i]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Stat bars — first two players */}
              {players.length >= 2 && (
                <div className="rounded-2xl border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: COLORS[0] }}>{players[0].name}</span>
                    <span className="text-muted-foreground">Head to Head</span>
                    <span style={{ color: COLORS[1] }}>{players[1].name}</span>
                  </div>
                  <StatRow label="Goals" a={players[0].stats.goals} b={players[1].stats.goals} />
                  <StatRow label="Assists" a={players[0].stats.assists} b={players[1].stats.assists} />
                  <StatRow label="Appearances" a={players[0].stats.appearances} b={players[1].stats.appearances} />
                  <StatRow label="Yellow Cards" a={players[0].stats.yellowCards} b={players[1].stats.yellowCards} higherIsBetter={false} />
                  <StatRow label="Rating" a={parseFloat((players[0].stats.rating ?? 6).toFixed(1))} b={parseFloat((players[1].stats.rating ?? 6).toFixed(1))} />
                </div>
              )}

              {/* Full stats table */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Stat</th>
                      {players.map((p, i) => (
                        <th key={p.id} className="px-4 py-3 text-xs font-semibold text-right" style={{ color: COLORS[i] }}>
                          {p.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Appearances', key: 'appearances' },
                      { label: 'Goals', key: 'goals' },
                      { label: 'Assists', key: 'assists' },
                      { label: 'Yellow Cards', key: 'yellowCards' },
                      { label: 'Red Cards', key: 'redCards' },
                      { label: 'Rating', key: 'rating' },
                    ].map(({ label, key }) => (
                      <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                        {players.map((p, i) => {
                          const val = p.stats[key as keyof typeof p.stats]
                          const displayVal = key === 'rating' ? (val as number).toFixed(1) : val
                          const allVals = players.map(pl => pl.stats[key as keyof typeof pl.stats] as number)
                          const isMax = (val as number) === Math.max(...allVals)
                          return (
                            <td key={p.id} className={cn('px-4 py-2.5 text-right font-semibold tabular-nums', isMax && 'text-green-600')}>
                              {displayVal as string | number}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {players.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">Search and add players to compare</p>
            </div>
          )}

          {players.length === 1 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm text-muted-foreground">Add at least one more player to compare</p>
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
