import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

const ParamsSchema = z.object({
  id: z.string().min(1),
})

const QuerySchema = z.object({
  seasonId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

function computeMinutes(inMin: number | null, outMin: number | null): {
  inMin: number | null
  outMin: number | null
  playedMinutes: number
} {
  const start = inMin ?? 0
  const end = outMin ?? 90
  const played = Math.max(0, end - start)
  return { inMin, outMin, playedMinutes: played }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const url = new URL(req.url)
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  const parsedQuery = QuerySchema.safeParse({
    seasonId: url.searchParams.get('seasonId') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })

  if (!parsedParams.success || !parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const playerId = parsedParams.data.id
  const { seasonId, limit } = parsedQuery.data

  const lineups = await db.matchLineup.findMany({
    where: {
      playerId,
      ...(seasonId
        ? {
            match: {
              seasonId,
            },
          }
        : {}),
    },
    include: {
      match: {
        include: {
          competition: true,
          homeTeam: true,
          awayTeam: true,
          events: true,
        },
      },
    },
    orderBy: {
      match: {
        kickoff: 'desc',
      },
    },
    take: limit,
  })

  const rows = lineups.map((l) => {
    const m = l.match
    const teamId = l.teamId
    const isHome = m.homeTeamId === teamId
    const opponent = isHome ? m.awayTeam : m.homeTeam

    const gf = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
    const ga = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0

    let result: string | null = null
    if (m.status === 'FINISHED') {
      if (gf > ga) result = `W ${gf}-${ga}`
      else if (gf === ga) result = `D ${gf}-${ga}`
      else result = `L ${gf}-${ga}`
    }

    const minutes = computeMinutes(l.inMin, l.outMin)

    let goals = 0
    let assists = 0
    let yellowCards = 0
    let redCards = 0

    const gaStats = parseJson<{ goals?: number; assists?: number }>(l.g_aJson)
    if (gaStats) {
      goals = gaStats.goals ?? 0
      assists = gaStats.assists ?? 0
    } else {
      for (const e of m.events) {
        if (e.playerId !== playerId) continue
        const t = e.type.toLowerCase()
        if (t === 'goal') goals += 1
        if (t === 'assist') assists += 1
        if (t === 'yellow') yellowCards += 1
        if (t === 'red') redCards += 1
      }
    }

    const cards = parseJson<{ yellow?: number; red?: number }>(l.cardsJson)
    if (cards) {
      yellowCards = cards.yellow ?? yellowCards
      redCards = cards.red ?? redCards
    }

    return {
      matchId: m.id,
      date: m.kickoff.toISOString(),
      competition: {
        id: m.competitionId ?? '',
        name: m.competition?.name ?? 'Unknown competition',
      },
      opponent: {
        id: opponent.id,
        name: opponent.name,
        badgeUrl: opponent.badgeUrl,
      },
      teamId,
      isHome,
      minutes,
      contributions: {
        goals,
        assists,
      },
      cards: {
        yellow: yellowCards,
        red: redCards,
      },
      rating: l.rating,
      result,
    }
  })

  return NextResponse.json({ matches: rows })
}

