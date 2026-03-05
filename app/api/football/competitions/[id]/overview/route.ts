import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid competition id' }, { status: 400 })
  }

  const competitionId = parsed.data.id

  const competition = await db.competition.findUnique({
    where: { id: competitionId },
  })

  if (!competition) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const activeSeason = await db.season.findFirst({
    where: { competitionId },
    orderBy: { yearStart: 'desc' },
  })

  const matches = await db.match.findMany({
    where: {
      competitionId,
      ...(activeSeason ? { seasonId: activeSeason.id } : {}),
    },
    select: {
      homeTeamId: true,
      awayTeamId: true,
    },
  })

  const teamIds = new Set<string>()
  for (const m of matches) {
    teamIds.add(m.homeTeamId)
    teamIds.add(m.awayTeamId)
  }

  const teamsCount = teamIds.size
  const matchesCount = matches.length

  const response = {
    competition: {
      id: competition.id,
      name: competition.name,
      country: competition.country,
      type: competition.type,
      logoUrl: competition.logoUrl,
    },
    activeSeason: activeSeason
      ? {
          id: activeSeason.id,
          yearStart: activeSeason.yearStart,
          yearEnd: activeSeason.yearEnd,
        }
      : null,
    teamsCount,
    matchesCount,
    currentRound: 'Matchday 1',
  }

  return NextResponse.json(response)
}

