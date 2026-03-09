import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  }

  const teamId = parsed.data.id

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      contracts: {
        include: {
          player: true,
        },
      },
      marketValues: {
        orderBy: { date: 'desc' },
        take: 12,
      },
    },
  })

  if (!team) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const finishedMatches = await db.match.findMany({
    where: {
      status: 'FINISHED',
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { kickoff: 'desc' },
    take: 5,
  })

  const form: string[] = finishedMatches.map((m) => {
    const isHome = m.homeTeamId === teamId
    const goalsFor = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
    const goalsAgainst = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
    if (goalsFor > goalsAgainst) return 'W'
    if (goalsFor === goalsAgainst) return 'D'
    return 'L'
  })

  const allFinished = await db.match.findMany({
    where: {
      status: 'FINISHED',
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
  })

  let tableSnapshot: {
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    points: number
  } | null = null

  if (allFinished.length > 0) {
    let wins = 0
    let draws = 0
    let losses = 0
    let goalsFor = 0
    let goalsAgainst = 0
    let points = 0

    for (const m of allFinished) {
      const isHome = m.homeTeamId === teamId
      const gf = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
      const ga = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
      goalsFor += gf
      goalsAgainst += ga

      if (gf > ga) {
        wins += 1
        points += 3
      } else if (gf === ga) {
        draws += 1
        points += 1
      } else {
        losses += 1
      }
    }

    tableSnapshot = {
      played: allFinished.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points,
    }
  }

  // squad valuation summary using latest player contract club links and player market values
  const latestClubValue = team.marketValues[0] ?? null

  const response = {
    id: team.id,
    name: team.name,
    badgeUrl: team.badgeUrl,
    country: team.country,
    venue: team.venue,
    coachName: team.coachName,
    form,
    tableSnapshot,
    valueSummary: latestClubValue
      ? {
          formatted: `€${(latestClubValue.valueEur / 1_000_000).toFixed(1)}m`,
          raw: latestClubValue.valueEur,
          currency: latestClubValue.currency,
          date: latestClubValue.date,
        }
      : null,
  }

  return NextResponse.json({ team: response })
}

