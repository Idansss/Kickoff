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
  mode: z.enum(['total', 'per_match']).default('total'),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const url = new URL(req.url)
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  const parsedQuery = QuerySchema.safeParse({
    mode: url.searchParams.get('mode') ?? undefined,
  })

  if (!parsedParams.success || !parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const playerId = parsedParams.data.id

  const lineups = await db.matchLineup.findMany({
    where: { playerId },
    include: {
      match: {
        include: {
          events: true,
        },
      },
    },
    orderBy: {
      match: {
        kickoff: 'desc',
      },
    },
  })

  const matchesPlayed = lineups.length

  let starts = 0
  let subsOn = 0
  let minutesTotal = 0
  let goals = 0
  let assists = 0
  let yellowCards = 0
  let redCards = 0
  const ratings: number[] = []

  function computeMinutes(inMin: number | null, outMin: number | null): number {
    const start = inMin ?? 0
    const end = outMin ?? 90
    return Math.max(0, end - start)
  }

  for (const l of lineups) {
    if (l.isStarting) starts += 1
    else subsOn += 1

    minutesTotal += computeMinutes(l.inMin, l.outMin)

    if (l.rating != null) ratings.push(l.rating)

    const gaStats = parseJson<{ goals?: number; assists?: number }>(l.g_aJson)
    if (gaStats) {
      goals += gaStats.goals ?? 0
      assists += gaStats.assists ?? 0
    } else {
      for (const e of l.match.events) {
        if (e.playerId !== playerId) continue
        const t = e.type.toLowerCase()
        if (t === 'goal') goals += 1
        if (t === 'assist') assists += 1
      }
    }

    const cards = parseJson<{ yellow?: number; red?: number }>(l.cardsJson)
    if (cards) {
      yellowCards += cards.yellow ?? 0
      redCards += cards.red ?? 0
    } else {
      for (const e of l.match.events) {
        if (e.playerId !== playerId) continue
        const t = e.type.toLowerCase()
        if (t === 'yellow') yellowCards += 1
        if (t === 'red') redCards += 1
      }
    }
  }

  const avgRating =
    ratings.length > 0 ? +(ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(2) : null

  const totals = {
    matchesPlayed,
    starts,
    subsOn,
    minutes: minutesTotal,
    goals,
    assists,
    yellowCards,
    redCards,
    avgRating,
  }

  const perMatch =
    matchesPlayed > 0
      ? {
          matchesPlayed,
          starts: +(starts / matchesPlayed).toFixed(2),
          subsOn: +(subsOn / matchesPlayed).toFixed(2),
          minutes: +(minutesTotal / matchesPlayed).toFixed(2),
          goals: +(goals / matchesPlayed).toFixed(2),
          assists: +(assists / matchesPlayed).toFixed(2),
          yellowCards: +(yellowCards / matchesPlayed).toFixed(2),
          redCards: +(redCards / matchesPlayed).toFixed(2),
          avgRating,
        }
      : null

  return NextResponse.json({
    totals,
    perMatch,
    matchesPlayed,
  })
}

