import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

const QuerySchema = z.object({
  scope: z.enum(['upcoming', 'played']).default('upcoming'),
  limit: z.coerce.number().int().min(1).max(50).default(50),
})

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

  const competitionId = parsedParams.data.id
  const { scope, limit } = parsedQuery.data

  const playedStatuses = ['FINISHED'] as const
  const upcomingStatuses = ['SCHEDULED', 'LIVE'] as const
  const statusFilter = scope === 'played' ? [...playedStatuses] : [...upcomingStatuses]

  const matches = await db.match.findMany({
    where: {
      competitionId,
      status: { in: statusFilter },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      kickoff: scope === 'played' ? 'desc' : 'asc',
    },
    take: limit,
  })

  const items = matches.map((m) => ({
    id: m.id,
    kickoff: m.kickoff.toISOString(),
    status: m.status,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      badgeUrl: m.homeTeam.badgeUrl,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      badgeUrl: m.awayTeam.badgeUrl,
    },
    score: {
      home: m.homeScore ?? 0,
      away: m.awayScore ?? 0,
    },
  }))

  return NextResponse.json({ matches: items })
}
