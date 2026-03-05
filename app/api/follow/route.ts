import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAuthedUserId } from '@/lib/auth'

const FollowActionSchema = z.object({
  action: z.enum(['FOLLOW', 'UNFOLLOW']),
  entityType: z.enum(['TEAM', 'PLAYER', 'MATCH', 'COMPETITION']),
  entityId: z.string().min(1),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const parsed = FollowActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid follow payload' }, { status: 400 })
    }

    const userId = await getAuthedUserId()
    const { action, entityType, entityId } = parsed.data

    if (action === 'FOLLOW') {
      await db.follow.upsert({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType,
            entityId,
          },
        },
        update: {},
        create: {
          userId,
          entityType,
          entityId,
        },
      })

      return NextResponse.json({ ok: true, following: true })
    }

    await db.follow.deleteMany({
      where: {
        userId,
        entityType,
        entityId,
      },
    })

    return NextResponse.json({ ok: true, following: false })
  } catch {
    return NextResponse.json({ error: 'Failed to update follow' }, { status: 500 })
  }
}

const FollowQuerySchema = z.object({
  entityType: z.enum(['TEAM', 'PLAYER', 'MATCH', 'COMPETITION']).optional(),
  entityId: z.string().optional(),
})

type FollowGroupResponse = {
  teams: { id: string; name: string; badgeUrl?: string | null }[]
  players: { id: string; name: string; photoUrl?: string | null }[]
  matches: {
    id: string
    kickoff: Date
    competitionName: string | null
    homeTeamName: string
    awayTeamName: string
  }[]
  competitions: { id: string; name: string; logoUrl?: string | null }[]
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthedUserId()
    const { searchParams } = new URL(req.url)
    const query = {
      entityType: searchParams.get('entityType') ?? undefined,
      entityId: searchParams.get('entityId') ?? undefined,
    }
    const parsed = FollowQuerySchema.safeParse(query)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const { entityType, entityId } = parsed.data

    if (entityType && entityId) {
      const existing = await db.follow.findUnique({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType,
            entityId,
          },
        },
      })

      return NextResponse.json({ following: !!existing })
    }

    const follows = await db.follow.findMany({
      where: { userId },
    })

    const response: FollowGroupResponse = {
      teams: [],
      players: [],
      matches: [],
      competitions: [],
    }

    const teamIds = follows
      .filter((f) => f.entityType === 'TEAM')
      .map((f) => f.entityId)
    const playerIds = follows
      .filter((f) => f.entityType === 'PLAYER')
      .map((f) => f.entityId)
    const matchIds = follows
      .filter((f) => f.entityType === 'MATCH')
      .map((f) => f.entityId)
    const competitionIds = follows
      .filter((f) => f.entityType === 'COMPETITION')
      .map((f) => f.entityId)

    if (teamIds.length > 0) {
      const teams = await db.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true, badgeUrl: true },
      })
      response.teams = teams
    }

    if (playerIds.length > 0) {
      const players = await db.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, name: true, photoUrl: true },
      })
      response.players = players
    }

    if (matchIds.length > 0) {
      const matches = await db.match.findMany({
        where: { id: { in: matchIds } },
        include: {
          competition: { select: { name: true } },
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      })

      response.matches = matches.map((m) => ({
        id: m.id,
        kickoff: m.kickoff,
        competitionName: m.competition?.name ?? null,
        homeTeamName: m.homeTeam.name,
        awayTeamName: m.awayTeam.name,
      }))
    }

    if (competitionIds.length > 0) {
      const competitions = await db.competition.findMany({
        where: { id: { in: competitionIds } },
        select: { id: true, name: true, logoUrl: true },
      })
      response.competitions = competitions
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 })
  }
}

