import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  scope: z.enum(['players', 'clubs', 'all']).optional().default('all'),
})

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null
  const diffMs = Date.now() - dob.getTime()
  return Math.abs(new Date(diffMs).getUTCFullYear() - 1970)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.format() }, { status: 400 })
  }

  const { limit, scope } = parsed.data

  type MoverEntry = {
    type: 'player' | 'club'
    id: string
    name: string
    badgeUrl?: string | null
    position?: string | null
    age?: number | null
    nationality?: string | null
    currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
    latestValueEur: number
    latestValueFormatted: string
    deltaEur: number
    deltaFormatted: string
    deltaDirection: 'up' | 'down'
    valueDate: string
  }

  const movers: MoverEntry[] = []

  // --- Player movers ---
  if (scope === 'players' || scope === 'all') {
    const players = await db.player.findMany({
      include: {
        currentTeam: { select: { id: true, name: true, badgeUrl: true } },
        marketValues: {
          orderBy: { date: 'desc' },
          take: 2,
        },
      },
    })

    for (const p of players) {
      const latest = p.marketValues[0]
      const previous = p.marketValues[1]
      if (!latest || !previous) continue
      const deltaEur = latest.valueEur - previous.valueEur
      if (deltaEur === 0) continue

      movers.push({
        type: 'player',
        id: p.id,
        name: p.name,
        position: p.position,
        age: calculateAge(p.dob ?? null),
        nationality: p.nationality,
        currentTeam: p.currentTeam,
        latestValueEur: latest.valueEur,
        latestValueFormatted: `€${(latest.valueEur / 1_000_000).toFixed(1)}m`,
        deltaEur,
        deltaFormatted: `${deltaEur >= 0 ? '+' : ''}€${(deltaEur / 1_000_000).toFixed(1)}m`,
        deltaDirection: deltaEur > 0 ? 'up' : 'down',
        valueDate: latest.date.toISOString(),
      })
    }
  }

  // --- Club movers ---
  if (scope === 'clubs' || scope === 'all') {
    const teams = await db.team.findMany({
      include: {
        marketValues: {
          orderBy: { date: 'desc' },
          take: 2,
        },
      },
    })

    for (const t of teams) {
      const latest = t.marketValues[0]
      const previous = t.marketValues[1]
      if (!latest || !previous) continue
      const deltaEur = latest.valueEur - previous.valueEur
      if (deltaEur === 0) continue

      movers.push({
        type: 'club',
        id: t.id,
        name: t.name,
        badgeUrl: t.badgeUrl,
        latestValueEur: latest.valueEur,
        latestValueFormatted: `€${(latest.valueEur / 1_000_000).toFixed(1)}m`,
        deltaEur,
        deltaFormatted: `${deltaEur >= 0 ? '+' : ''}€${(deltaEur / 1_000_000).toFixed(1)}m`,
        deltaDirection: deltaEur > 0 ? 'up' : 'down',
        valueDate: latest.date.toISOString(),
      })
    }
  }

  // Split into gainers / losers, sort by absolute delta
  const gainers = movers
    .filter((m) => m.deltaDirection === 'up')
    .sort((a, b) => b.deltaEur - a.deltaEur)
    .slice(0, limit)

  const losers = movers
    .filter((m) => m.deltaDirection === 'down')
    .sort((a, b) => a.deltaEur - b.deltaEur)
    .slice(0, limit)

  return NextResponse.json({ gainers, losers })
}
