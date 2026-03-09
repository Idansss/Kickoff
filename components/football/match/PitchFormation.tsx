'use client'

import { ClubIdentity } from '@/components/common/ClubIdentity'
import { cn } from '@/lib/utils'
import type { MatchLineupsDTO, MatchLineupPlayerDTO } from '@/lib/football/providers/types'

type MatchTeam = {
  id: string
  name: string
  badgeUrl?: string | null
}

interface Props {
  lineups: MatchLineupsDTO
  homeTeam: MatchTeam
  awayTeam: MatchTeam
  homeColor?: string
  awayColor?: string
}

// Map positions to grid row/column on pitch
const POSITION_ROW: Record<string, number> = {
  GK: 1,
  LB: 2, CB: 2, RB: 2, LWB: 2, RWB: 2, SW: 2,
  LM: 3, CM: 3, RM: 3, DM: 3, CDM: 3, CAM: 4, AM: 4,
  LW: 4, RW: 4, SS: 4, CF: 5, ST: 5, FW: 5,
}

function guessRow(player: MatchLineupPlayerDTO, index: number, total: number): number {
  const pos = (player.position ?? '').toUpperCase()
  if (POSITION_ROW[pos]) return POSITION_ROW[pos]
  // Fallback: spread evenly
  if (index === 0) return 1
  if (index <= 4) return 2
  if (index <= 7) return 3
  if (index <= 9) return 4
  return 5
}

function groupByRow(players: MatchLineupPlayerDTO[]): Map<number, MatchLineupPlayerDTO[]> {
  const map = new Map<number, MatchLineupPlayerDTO[]>()
  players.forEach((p, i) => {
    const row = guessRow(p, i, players.length)
    if (!map.has(row)) map.set(row, [])
    map.get(row)!.push(p)
  })
  return map
}

function PlayerDot({
  player,
  color,
  flipped,
}: {
  player: MatchLineupPlayerDTO
  color: string
  flipped?: boolean
}) {
  const shortName = player.name.split(' ').slice(-1)[0] ?? player.name
  return (
    <div className="flex flex-col items-center gap-0.5 group">
      <div
        className={cn(
          'h-8 w-8 rounded-full border-2 border-white/80 flex items-center justify-center text-white text-[10px] font-bold shadow-md transition-transform group-hover:scale-110',
        )}
        style={{ backgroundColor: color }}
        title={player.name}
      >
        {player.shirtNo ?? shortName.slice(0, 2).toUpperCase()}
      </div>
      <span className="text-[9px] font-semibold text-white drop-shadow leading-tight text-center max-w-[48px] truncate">
        {shortName}
      </span>
      {player.rating != null && (
        <span className={cn(
          'text-[8px] font-bold rounded px-1',
          player.rating >= 7.5 ? 'bg-green-500 text-white' : player.rating >= 6.5 ? 'bg-yellow-500 text-gray-900' : 'bg-red-500 text-white'
        )}>
          {player.rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function TeamHalf({
  players,
  color,
  flipped,
}: {
  players: MatchLineupPlayerDTO[]
  color: string
  flipped?: boolean
}) {
  const rows = groupByRow(players)
  const rowKeys = Array.from(rows.keys()).sort((a, b) => flipped ? b - a : a - b)

  return (
    <div className="flex flex-col justify-around flex-1 py-2 px-1 gap-1">
      {rowKeys.map((row) => (
        <div key={row} className="flex justify-around items-center">
          {rows.get(row)!.map((p) => (
            <PlayerDot key={p.id} player={p} color={color} flipped={flipped} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PitchFormation({
  lineups,
  homeTeam,
  awayTeam,
  homeColor = '#16a34a',
  awayColor = '#2563eb',
}: Props) {
  const home = lineups.home.startingXI
  const away = lineups.away.startingXI

  if (home.length === 0 && away.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: homeColor }} />
          <ClubIdentity
            name={homeTeam.name}
            badgeUrl={homeTeam.badgeUrl}
            size="sm"
            textClassName="text-sm font-semibold"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">Formation</span>
        <div className="flex items-center gap-2">
          <ClubIdentity
            name={awayTeam.name}
            badgeUrl={awayTeam.badgeUrl}
            size="sm"
            textClassName="text-sm font-semibold"
          />
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: awayColor }} />
        </div>
      </div>

      {/* Pitch */}
      <div
        className="relative flex"
        style={{
          background: 'linear-gradient(180deg, #1a7a3a 0%, #1e8a42 25%, #1a7a3a 50%, #1e8a42 75%, #1a7a3a 100%)',
          minHeight: 340,
        }}
      >
        {/* Pitch markings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 340" preserveAspectRatio="none">
          {/* Outer border */}
          <rect x="8" y="8" width="584" height="324" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Centre line */}
          <line x1="300" y1="8" x2="300" y2="332" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Centre circle */}
          <circle cx="300" cy="170" r="44" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <circle cx="300" cy="170" r="3" fill="rgba(255,255,255,0.5)" />
          {/* Left penalty area */}
          <rect x="8" y="100" width="90" height="140" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <rect x="8" y="130" width="40" height="80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="95" cy="170" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Right penalty area */}
          <rect x="502" y="100" width="90" height="140" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <rect x="552" y="130" width="40" height="80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="505" cy="170" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>

        {/* Home team (left side) */}
        <div className="flex-1 flex flex-col relative z-10">
          <TeamHalf players={home} color={homeColor} />
        </div>

        {/* Away team (right side, mirrored) */}
        <div className="flex-1 flex flex-col relative z-10">
          <TeamHalf players={away} color={awayColor} flipped />
        </div>
      </div>

      {/* Bench */}
      {(lineups.home.bench.length > 0 || lineups.away.bench.length > 0) && (
        <div className="bg-card border-t border-border p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bench</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold" style={{ color: homeColor }}>
                {homeTeam.name}
              </p>
              <div className="flex flex-wrap gap-1">
                {lineups.home.bench.map((p) => (
                  <span key={p.id} className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-medium">
                    {p.shirtNo ? `${p.shirtNo}. ` : ''}{p.name.split(' ').slice(-1)[0]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold text-right" style={{ color: awayColor }}>
                {awayTeam.name}
              </p>
              <div className="flex flex-wrap gap-1 justify-end">
                {lineups.away.bench.map((p) => (
                  <span key={p.id} className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-medium">
                    {p.shirtNo ? `${p.shirtNo}. ` : ''}{p.name.split(' ').slice(-1)[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
