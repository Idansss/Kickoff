import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  window: z.enum(['30d', '90d', '365d']).optional().default('90d'),
  scope: z.enum(['players', 'clubs', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
})

function fmt(eur: number): string {
  const abs = Math.abs(eur)
  const sign = eur < 0 ? '-' : '+'
  if (abs >= 1_000_000_000) return `${sign}€${(abs / 1_000_000_000).toFixed(1)}bn`
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}m`
  return `${sign}€${(abs / 1_000).toFixed(0)}k`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  const { window: win, scope, limit } = parsed.data

  const days = win === '30d' ? 30 : win === '365d' ? 365 : 90
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const now = new Date()

  type MoverEntry = {
    id: string
    name: string
    badgeUrl?: string | null
    position?: string | null
    currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
    type: 'player' | 'club'
    latestValueEur: number
    latestValueFormatted: string
    deltaEur: number
    deltaFormatted: string
    deltaDirection: 'up' | 'down'
    deltaPct: number
  }

  type MoverBase = Omit<MoverEntry, 'type'>

  function computeMovers<T extends { valueEur: number }>(
    snapshots: T[],
    keyFn: (s: T) => string,
    entityFn: (snaps: T[]) => Omit<MoverBase, 'latestValueEur' | 'latestValueFormatted' | 'deltaEur' | 'deltaFormatted' | 'deltaDirection' | 'deltaPct'>,
  ): MoverBase[] {
    const byEntity = new Map<string, T[]>()
    for (const snap of snapshots) {
      const key = keyFn(snap)
      if (!byEntity.has(key)) byEntity.set(key, [])
      byEntity.get(key)!.push(snap)
    }

    const entries: MoverBase[] = []
    for (const [, snaps] of byEntity) {
      if (snaps.length < 2) continue
      const earliest = snaps[0]
      const latest = snaps[snaps.length - 1]
      const delta = latest.valueEur - earliest.valueEur
      if (delta === 0) continue
      entries.push({
        ...entityFn(snaps),
        latestValueEur: latest.valueEur,
        latestValueFormatted: `€${(latest.valueEur / 1_000_000).toFixed(1)}m`,
        deltaEur: delta,
        deltaFormatted: fmt(delta),
        deltaDirection: delta > 0 ? 'up' : 'down',
        deltaPct: earliest.valueEur > 0 ? Math.round((Math.abs(delta) / earliest.valueEur) * 100) : 0,
      })
    }
    return entries
  }

  async function getMovers(type: 'players' | 'clubs'): Promise<MoverBase[]> {
    if (type === 'players') {
      const snapshots = await db.marketValueSnapshot.findMany({
        where: { playerId: { not: null }, teamId: null, date: { gte: cutoff, lte: now } },
        orderBy: { date: 'asc' },
        include: { player: { select: { id: true, name: true, position: true, photoUrl: true, currentTeam: { select: { id: true, name: true, badgeUrl: true } } } } },
      })
      return computeMovers(
        snapshots,
        (s) => s.playerId!,
        (snaps) => ({
          id: snaps[0].player!.id,
          name: snaps[0].player!.name,
          badgeUrl: snaps[0].player?.currentTeam?.badgeUrl ?? null,
          position: snaps[0].player?.position ?? null,
          currentTeam: snaps[0].player?.currentTeam ?? null,
        }),
      )
    } else {
      const snapshots = await db.marketValueSnapshot.findMany({
        where: { teamId: { not: null }, playerId: null, date: { gte: cutoff, lte: now } },
        orderBy: { date: 'asc' },
        include: { team: { select: { id: true, name: true, badgeUrl: true } } },
      })
      return computeMovers(
        snapshots,
        (s) => s.teamId!,
        (snaps) => ({
          id: snaps[0].team!.id,
          name: snaps[0].team!.name,
          badgeUrl: snaps[0].team?.badgeUrl ?? null,
          position: null,
          currentTeam: null,
        }),
      )
    }
  }

  const [playerMovers, clubMovers] = await Promise.all([
    scope !== 'clubs' ? getMovers('players') : Promise.resolve([]),
    scope !== 'players' ? getMovers('clubs') : Promise.resolve([]),
  ])

  const allMovers = [...playerMovers.map(e => ({ ...e, type: 'player' as const })), ...clubMovers.map(e => ({ ...e, type: 'club' as const }))]

  const gainers = allMovers
    .filter(e => e.deltaDirection === 'up')
    .sort((a, b) => b.deltaEur - a.deltaEur)
    .slice(0, limit)

  const losers = allMovers
    .filter(e => e.deltaDirection === 'down')
    .sort((a, b) => a.deltaEur - b.deltaEur)
    .slice(0, limit)

  return NextResponse.json({
    window: win,
    scope,
    cutoffDate: cutoff.toISOString(),
    gainers,
    losers,
  })
}
