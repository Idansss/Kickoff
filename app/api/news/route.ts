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

type NewsScopeDb = 'LATEST' | 'TRANSFERS' | 'LEAGUE'

type NewsWhere = {
  scope: NewsScopeDb
  competitionId?: string
  teamId?: string
  OR?: Array<
    | {
        competitionId: { in: string[] }
      }
    | {
        teamId: { in: string[] }
      }
  >
}

type NewsItemRow = {
  id: string
  title: string
  summary?: string | null
  source?: string | null
  url?: string | null
  imageUrl?: string | null
  publishedAt?: Date | string | null
  teamId?: string | null
  competitionId?: string | null
}

type NewsItemDelegate = {
  findMany?: (args: {
    where: NewsWhere
    orderBy: { publishedAt: 'desc' }
    take: number
  }) => Promise<NewsItemRow[]>
}

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
    try {
      const userId = await getAuthedUserId()
      const follows = await db.follow.findMany({
        where: { userId },
      })

      followedCompetitionIds = follows
        .filter((f) => f.entityType === 'COMPETITION')
        .map((f) => f.entityId)
      followedTeamIds = follows.filter((f) => f.entityType === 'TEAM').map((f) => f.entityId)
    } catch {
      return NextResponse.json({ items: [] })
    }
  }

  const where: NewsWhere = {
    scope: scope === 'latest' ? 'LATEST' : scope === 'transfers' ? 'TRANSFERS' : 'LEAGUE',
  }

  if (competitionId) {
    where.competitionId = competitionId
  }
  if (teamId) {
    where.teamId = teamId
  }

  if (followedOnly) {
    const orFilters: NonNullable<NewsWhere['OR']> = []
    if (followedCompetitionIds && followedCompetitionIds.length > 0) {
      orFilters.push({ competitionId: { in: followedCompetitionIds } })
    }
    if (followedTeamIds && followedTeamIds.length > 0) {
      orFilters.push({ teamId: { in: followedTeamIds } })
    }

    // If there are no followed competition or team ids, return empty immediately
    if (orFilters.length === 0) {
      return NextResponse.json({ items: [] })
    }
    where.OR = orFilters
  }

  const newsItemDelegate = (db as unknown as { newsItem?: NewsItemDelegate }).newsItem
  let items: NewsItemRow[] = []
  try {
    items =
      (await newsItemDelegate?.findMany?.({
        where,
        orderBy: {
          publishedAt: 'desc',
        },
        take: 50,
      })) ?? []
  } catch {
    return NextResponse.json({ items: [] })
  }

  const mapped = items.map((item) => {
    const date =
      item.publishedAt instanceof Date
        ? item.publishedAt
        : new Date(item.publishedAt ?? Date.now())

    return {
      id: item.id,
      title: item.title,
      summary: item.summary ?? undefined,
      source: item.source ?? undefined,
      url: item.url ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
      publishedAt: Number.isNaN(date.getTime())
        ? new Date().toISOString()
        : date.toISOString(),
      teamId: item.teamId ?? undefined,
      competitionId: item.competitionId ?? undefined,
    }
  })

  return NextResponse.json({ items: mapped })
}
