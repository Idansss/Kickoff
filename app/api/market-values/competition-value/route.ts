import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  competitionId: z.string().min(1),
})

function fmt(eur: number): string {
  if (eur >= 1_000_000_000) return `€${(eur / 1_000_000_000).toFixed(1)}bn`
  if (eur >= 1_000_000) return `€${(eur / 1_000_000).toFixed(1)}m`
  return `€${(eur / 1_000).toFixed(0)}k`
}

function calcAge(dob: Date | null): number | null {
  if (!dob) return null
  return Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({ competitionId: searchParams.get('competitionId') ?? '' })
  if (!parsed.success) {
    return NextResponse.json({ error: 'competitionId is required' }, { status: 400 })
  }

  const { competitionId } = parsed.data
  const now = new Date()

  // Get teams in this competition via StandingRow
  const standing = await db.standingRow.findMany({
    where: { competitionId },
    select: { teamId: true },
    distinct: ['teamId'],
  })
  const teamIds = standing.map((s) => s.teamId)

  if (teamIds.length === 0) {
    return NextResponse.json({
      competitionId,
      totalValue: { eur: 0, formatted: '—' },
      avgValuePerPlayer: { eur: 0, formatted: '—' },
      topClubs: [],
      topPlayers: [],
    })
  }

  // Latest club market value snapshots
  const clubSnapshots = await Promise.all(
    teamIds.map((id) =>
      db.marketValueSnapshot.findFirst({
        where: { teamId: id, playerId: null, date: { lte: now } },
        orderBy: { date: 'desc' },
        include: { team: { select: { id: true, name: true, badgeUrl: true } } },
      }),
    ),
  )

  const clubValues = clubSnapshots
    .filter((s): s is NonNullable<typeof s> & { team: NonNullable<NonNullable<typeof s>['team']> } => s != null && s.team != null)
    .sort((a, b) => b.valueEur - a.valueEur)

  const totalClubValueEur = clubValues.reduce((sum, c) => sum + c.valueEur, 0)

  const topClubs = clubValues.slice(0, 10).map((s) => ({
    id: s.team.id,
    name: s.team.name,
    badgeUrl: s.team.badgeUrl,
    valueFormatted: fmt(s.valueEur),
    valueEur: s.valueEur,
  }))

  // Top 20 most valuable players in these teams
  const topPlayerRows = await db.player.findMany({
    where: {
      currentTeamId: { in: teamIds },
      marketValues: { some: { playerId: { not: null }, date: { lte: now } } },
    },
    include: {
      currentTeam: { select: { id: true, name: true, badgeUrl: true } },
      marketValues: {
        where: { playerId: { not: null } },
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  })

  const playersWithValue = topPlayerRows
    .filter((p) => p.marketValues[0] != null)
    .sort((a, b) => (b.marketValues[0]?.valueEur ?? 0) - (a.marketValues[0]?.valueEur ?? 0))
    .slice(0, 20)

  const topPlayers = playersWithValue.map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    position: p.position,
    nationality: p.nationality,
    age: calcAge(p.dob ?? null),
    currentTeam: p.currentTeam,
    valueFormatted: fmt(p.marketValues[0]?.valueEur ?? 0),
    valueEur: p.marketValues[0]?.valueEur ?? 0,
  }))

  const totalPlayerValueEur = playersWithValue.reduce(
    (sum, p) => sum + (p.marketValues[0]?.valueEur ?? 0),
    0,
  )

  const avgValuePerPlayer =
    topPlayers.length > 0 ? Math.round(totalPlayerValueEur / topPlayers.length) : 0

  return NextResponse.json({
    competitionId,
    totalValue: {
      eur: totalClubValueEur > 0 ? totalClubValueEur : totalPlayerValueEur,
      formatted: fmt(totalClubValueEur > 0 ? totalClubValueEur : totalPlayerValueEur),
    },
    avgValuePerPlayer: {
      eur: avgValuePerPlayer,
      formatted: avgValuePerPlayer > 0 ? fmt(avgValuePerPlayer) : '—',
    },
    topClubs,
    topPlayers,
  })
}
