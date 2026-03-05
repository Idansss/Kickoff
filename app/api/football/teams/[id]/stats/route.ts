import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

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

  const teamId = parsedParams.data.id

  const matches = await db.match.findMany({
    where: {
      status: 'FINISHED',
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: {
      events: true,
    },
  })

  const matchesPlayed = matches.length

  let points = 0
  let goalsFor = 0
  let goalsAgainst = 0
  let cleanSheets = 0
  let yellowCards = 0
  let redCards = 0

  let xg = 0
  let xga = 0
  let bigChances = 0

  for (const m of matches) {
    const isHome = m.homeTeamId === teamId
    const gf = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
    const ga = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0

    goalsFor += gf
    goalsAgainst += ga

    if (gf > ga) points += 3
    else if (gf === ga) points += 1

    if (ga === 0) cleanSheets += 1

    for (const e of m.events) {
      if (e.teamId !== teamId) continue
      const type = e.type.toLowerCase()
      if (type === 'yellow') yellowCards += 1
      if (type === 'red' || type === 'redcard') redCards += 1
    }

    const stats = m.statsJson as any | null
    if (stats) {
      const teamKey = isHome ? 'home' : 'away'
      const oppKey = isHome ? 'away' : 'home'

      if (stats.xg?.[teamKey] != null) xg += Number(stats.xg[teamKey])
      if (stats.xg?.[oppKey] != null) xga += Number(stats.xg[oppKey])
      if (stats.bigChances?.[teamKey] != null) bigChances += Number(stats.bigChances[teamKey])
    }
  }

  const totals = {
    points,
    goalsFor,
    goalsAgainst,
    cleanSheets,
    yellowCards,
    redCards,
    xg: matchesPlayed > 0 ? xg : null,
    xga: matchesPlayed > 0 ? xga : null,
    bigChances: matchesPlayed > 0 ? bigChances : null,
  }

  const perMatch =
    matchesPlayed > 0
      ? {
          points: +(points / matchesPlayed).toFixed(2),
          goalsFor: +(goalsFor / matchesPlayed).toFixed(2),
          goalsAgainst: +(goalsAgainst / matchesPlayed).toFixed(2),
          cleanSheets: +(cleanSheets / matchesPlayed).toFixed(2),
          yellowCards: +(yellowCards / matchesPlayed).toFixed(2),
          redCards: +(redCards / matchesPlayed).toFixed(2),
          xg: xg ? +(xg / matchesPlayed).toFixed(2) : null,
          xga: xga ? +(xga / matchesPlayed).toFixed(2) : null,
          bigChances: bigChances ? +(bigChances / matchesPlayed).toFixed(2) : null,
        }
      : null

  return NextResponse.json({
    totals,
    perMatch,
    matchesPlayed,
  })
}

