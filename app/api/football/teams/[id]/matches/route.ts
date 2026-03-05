import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

const QuerySchema = z.object({
  scope: z.enum(['played', 'upcoming']).default('played'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const url = new URL(req.url)
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  const parsedQuery = QuerySchema.safeParse({
    scope: url.searchParams.get('scope') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })

  if (!parsedParams.success || !parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const teamId = parsedParams.data.id
  const { scope, limit } = parsedQuery.data

  const playedStatuses = ['FINISHED']
  const upcomingStatuses = ['SCHEDULED', 'LIVE']
  const statusFilter = scope === 'played' ? playedStatuses : upcomingStatuses

  const matches = await db.match.findMany({
    where: {
      status: { in: statusFilter },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: {
      competition: true,
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      kickoff: scope === 'played' ? 'desc' : 'asc',
    },
    take: limit,
  })

  const items = matches.map((m) => {
    const isHome = m.homeTeamId === teamId
    const opponent = isHome ? m.awayTeam : m.homeTeam
    const gf = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
    const ga = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0

    let result: 'W' | 'D' | 'L' | null = null
    if (m.status === 'FINISHED') {
      if (gf > ga) result = 'W'
      else if (gf === ga) result = 'D'
      else result = 'L'
    }

    return {
      id: m.id,
      kickoff: m.kickoff.toISOString(),
      status: m.status,
      competition: {
        id: m.competitionId ?? '',
        name: m.competition?.name ?? 'Unknown competition',
        logoUrl: m.competition?.logoUrl ?? null,
      },
      isHome,
      opponent: {
        id: opponent.id,
        name: opponent.name,
        badgeUrl: opponent.badgeUrl,
      },
      score: {
        for: gf,
        against: ga,
      },
      result,
    }
  })

  return NextResponse.json({ matches: items })
}

