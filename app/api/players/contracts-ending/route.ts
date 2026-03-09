import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z
    .enum(['end_asc', 'value_desc', 'name_asc'])
    .optional()
    .default('end_asc'),
  competitionId: z.string().optional(),
  clubId: z.string().optional(),
  position: z.string().optional(),
  agentId: z.string().optional(),
  agencyId: z.string().optional(),
  endFrom: z.coerce.date().optional(),
  endTo: z.coerce.date().optional(),
  valueMin: z.coerce.number().int().min(0).optional(),
  valueMax: z.coerce.number().int().min(0).optional(),
})

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = Object.fromEntries(searchParams.entries())
  const parsed = QuerySchema.safeParse(rawQuery)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.format() }, { status: 400 })
  }

  const {
    page,
    pageSize,
    sort,
    competitionId,
    clubId,
    position,
    agentId,
    agencyId,
    endFrom,
    endTo,
    valueMin,
    valueMax,
  } = parsed.data

  const skip = (page - 1) * pageSize
  const take = pageSize

  const now = new Date()

  // base contract filter: active contracts ending in a given window
  const endWindow: any = {}
  if (endFrom) endWindow.gte = endFrom
  else endWindow.gte = now
  if (endTo) endWindow.lte = endTo

  const contractWhere: any = {
    status: 'ACTIVE',
    endDate: endWindow,
  }

  if (clubId) {
    contractWhere.clubId = clubId
  }

  if (agentId) {
    contractWhere.agentId = agentId
  }

  const wherePlayerClauses: any[] = []
  if (position) {
    wherePlayerClauses.push({ position: { equals: position } })
  }

  // optional filter by agency via PlayerAgent
  const agencyFilter =
    agencyId != null
      ? {
          playerAgents: {
            some: {
              agencyId,
              OR: [{ endDate: null }, { endDate: { gt: now } }],
            },
          },
        }
      : {}

  // optional filter by competition via squads+season
  const competitionFilter =
    competitionId != null
      ? {
          squads: {
            some: {
              season: {
                competitionId,
              },
            },
          },
        }
      : {}

  const valueFilter =
    valueMin != null || valueMax != null
      ? {
          marketValues: {
            some: {
              date: {
                lte: now,
              },
              ...(valueMin != null ? { valueEur: { gte: valueMin } } : {}),
              ...(valueMax != null ? { valueEur: { lte: valueMax } } : {}),
            },
          },
        }
      : {}

  const wherePlayer: any = {
    AND: [...wherePlayerClauses, agencyFilter, competitionFilter, valueFilter].filter(
      (clause) => Object.keys(clause).length > 0,
    ),
  }

  // relation filter applied at the contract level so we don't use `where` inside `include`
  const playerRelationFilter =
    Array.isArray(wherePlayer.AND) && wherePlayer.AND.length > 0 ? { player: wherePlayer } : {}

  // we query contracts directly to have precise endDate ordering and include player + club
  const [contracts, total] = await Promise.all([
    db.playerContract.findMany({
      where: {
        ...contractWhere,
        ...playerRelationFilter,
      },
      skip,
      take,
      orderBy: { endDate: 'asc' },
      include: {
        player: {
          include: {
            currentTeam: {
              select: { id: true, name: true, badgeUrl: true },
            },
            marketValues: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
        club: true,
      },
    }),
    db.playerContract.count({
      where: {
        ...contractWhere,
        ...playerRelationFilter,
      },
    }),
  ])

  const filteredContracts = contracts.filter((c) => c.player != null)

  let enriched = filteredContracts.map((c) => {
    const p = c.player!
    const age = calculateAge(p.dob ?? null)
    const latestValue = p.marketValues[0]
    return {
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      position: p.position,
      age,
      currentTeam: p.currentTeam,
      club: c.club
        ? {
            id: c.club.id,
            name: c.club.name,
            badgeUrl: c.club.badgeUrl,
          }
        : null,
      contract: {
        id: c.id,
        endDate: c.endDate,
        status: c.status,
      },
      marketValue: latestValue
        ? {
            raw: latestValue.valueEur,
            formatted: `€${(latestValue.valueEur / 1_000_000).toFixed(1)}m`,
            date: latestValue.date,
          }
        : null,
    }
  })

  if (sort === 'value_desc') {
    enriched = enriched.sort((a, b) => (b.marketValue?.raw ?? 0) - (a.marketValue?.raw ?? 0))
  } else if (sort === 'name_asc') {
    enriched = enriched.sort((a, b) => a.name.localeCompare(b.name))
  } // default end_asc is handled by initial query ordering

  const totalPages = Math.ceil(total / pageSize)

  return NextResponse.json({
    page,
    pageSize,
    total: filteredContracts.length,
    totalPages,
    results: enriched,
  })
}

