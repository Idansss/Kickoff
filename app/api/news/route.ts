import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAuthedUserId } from '@/lib/auth'

const QuerySchema = z.object({
  scope: z.enum(['latest', 'transfers', 'league']).default('latest'),
  competitionId: z.string().optional(),
  teamId: z.string().optional(),
  followedOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
})

export async function GET(req: Request) {
  const url = new URL(req.url)

  const parsed = QuerySchema.safeParse({
    scope: url.searchParams.get('scope') ?? undefined,
    competitionId: url.searchParams.get('competitionId') ?? undefined,
    teamId: url.searchParams.get('teamId') ?? undefined,
    followedOnly: url.searchParams.get('followedOnly') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  const { scope, competitionId, teamId, followedOnly } = parsed.data

  let followedCompetitionIds: string[] | undefined
  let followedTeamIds: string[] | undefined

  if (followedOnly) {
    const userId = await getAuthedUserId()
    const follows = await db.follow.findMany({
      where: { userId },
    })

    followedCompetitionIds = follows
      .filter((f) => f.entityType === 'COMPETITION')
      .map((f) => f.entityId)
    followedTeamIds = follows.filter((f) => f.entityType === 'TEAM').map((f) => f.entityId)
  }

  const where: any = {
    scope: scope === 'latest' ? 'LATEST' : scope === 'transfers' ? 'TRANSFERS' : 'LEAGUE',
  }

  if (competitionId) {
    where.competitionId = competitionId
  }
  if (teamId) {
    where.teamId = teamId
  }

  if (followedOnly) {
    where.OR = [
      followedCompetitionIds && followedCompetitionIds.length > 0
        ? { competitionId: { in: followedCompetitionIds } }
        : undefined,
      followedTeamIds && followedTeamIds.length > 0
        ? { teamId: { in: followedTeamIds } }
        : undefined,
    ].filter(Boolean)

    // If there are no followed competition or team ids, return empty immediately
    if (where.OR.length === 0) {
      return NextResponse.json({ items: [] })
    }
  }

  const items = await (db as any).newsItem?.findMany?.({
    where,
    orderBy: {
      publishedAt: 'desc',
    },
    take: 50,
  })

  const mapped =
    (items ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary ?? undefined,
      source: item.source ?? undefined,
      url: item.url ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
      publishedAt: (item.publishedAt as Date).toISOString(),
      teamId: item.teamId ?? undefined,
      competitionId: item.competitionId ?? undefined,
    })) ?? []

  return NextResponse.json({ items: mapped })
}

