import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z
    .enum(['value_desc', 'age_asc', 'age_desc', 'name_asc'])
    .optional()
    .default('value_desc'),
  nationality: z.string().optional(),
  birthCountry: z.string().optional(),
  preferredFoot: z.string().optional(),
  confederation: z.string().optional(), // placeholder for future data
  competition: z.string().optional(), // placeholder for future data
  clubId: z.string().optional(),
  position: z.string().optional(),
  positions: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((p) => p.trim()).filter(Boolean) : undefined)),
  loanStatus: z.enum(['on-loan', 'owned', 'free-agent']).optional(),
  agentId: z.string().optional(),
  agencyId: z.string().optional(),
  ageMin: z.coerce.number().int().min(0).max(60).optional(),
  ageMax: z.coerce.number().int().min(0).max(60).optional(),
  heightMin: z.coerce.number().int().min(120).max(230).optional(),
  heightMax: z.coerce.number().int().min(120).max(230).optional(),
  valueMin: z.coerce.number().int().min(0).optional(),
  valueMax: z.coerce.number().int().min(0).optional(),
  contractEndYear: z.coerce.number().int().optional(),
  contractBefore: z.coerce.date().optional(),
  currency: z.string().optional().default('EUR'),
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
    nationality,
    birthCountry,
    preferredFoot,
    clubId,
    position,
    positions,
    loanStatus,
    agentId,
    agencyId,
    ageMin,
    ageMax,
    heightMin,
    heightMax,
    valueMin,
    valueMax,
    contractEndYear,
    contractBefore,
  } = parsed.data

  const skip = (page - 1) * pageSize
  const take = pageSize

  const whereClauses: any[] = []

  if (nationality) {
    whereClauses.push({ nationality: { equals: nationality } })
  }

  if (birthCountry) {
    whereClauses.push({ birthCountry: { equals: birthCountry } })
  }

  if (preferredFoot) {
    whereClauses.push({ preferredFoot: { equals: preferredFoot } })
  }

  if (clubId) {
    whereClauses.push({ currentTeamId: clubId })
  }

  const positionsList = positions ?? (position ? [position] : undefined)
  if (positionsList && positionsList.length > 0) {
    whereClauses.push({ position: { in: positionsList } })
  }

  // age filters (computed from dob)
  const now = new Date()
  if (ageMin != null || ageMax != null) {
    const dobFilter: any = {}
    if (ageMin != null) {
      const maxDob = new Date(now)
      maxDob.setFullYear(maxDob.getFullYear() - ageMin)
      dobFilter.lte = maxDob
    }
    if (ageMax != null) {
      const minDob = new Date(now)
      minDob.setFullYear(minDob.getFullYear() - ageMax)
      dobFilter.gte = minDob
    }
    whereClauses.push({ dob: dobFilter })
  }

  if (heightMin != null || heightMax != null) {
    const heightFilter: any = {}
    if (heightMin != null) heightFilter.gte = heightMin
    if (heightMax != null) heightFilter.lte = heightMax
    whereClauses.push({ heightCm: heightFilter })
  }

  // agent / agency filters via PlayerAgent
  const agentFilter: any = {}
  if (agentId) {
    agentFilter.agentId = agentId
  }
  if (agencyId) {
    agentFilter.agencyId = agencyId
  }

  const playerAgentFilter =
    agentId || agencyId
      ? {
          some: {
            ...agentFilter,
            OR: [{ endDate: null }, { endDate: { gt: now } }],
          },
        }
      : undefined

  // loan status & free agents via PlayerContract
  let contractFilter: any | undefined
  if (loanStatus === 'on-loan') {
    contractFilter = {
      some: {
        isOnLoan: true,
        status: 'ACTIVE',
      },
    }
  } else if (loanStatus === 'owned') {
    contractFilter = {
      some: {
        isOnLoan: false,
        status: 'ACTIVE',
      },
    }
  } else if (loanStatus === 'free-agent') {
    contractFilter = {
      some: {
        status: 'EXPIRED',
        clubId: null,
      },
    }
  }

  if (contractEndYear != null || contractBefore != null) {
    const endFilter: any = {}
    if (contractEndYear != null) {
      const start = new Date(contractEndYear, 0, 1)
      const end = new Date(contractEndYear, 11, 31, 23, 59, 59)
      endFilter.gte = start
      endFilter.lte = end
    }
    if (contractBefore != null) {
      endFilter.lte = contractBefore
    }

    const base = {
      status: 'ACTIVE',
      endDate: endFilter,
    }

    contractFilter = contractFilter
      ? {
          some: {
            AND: [base],
          },
        }
      : { some: base }
  }

  // market value filters via latest snapshot
  const valueFilter =
    valueMin != null || valueMax != null
      ? {
          some: {
            date: {
              lte: now,
            },
            ...(valueMin != null ? { valueEur: { gte: valueMin } } : {}),
            ...(valueMax != null ? { valueEur: { lte: valueMax } } : {}),
          },
        }
      : undefined

  const where: any = {
    AND: [
      ...(whereClauses.length ? whereClauses : []),
      playerAgentFilter ? { playerAgents: playerAgentFilter } : {},
      contractFilter ? { contracts: contractFilter } : {},
      valueFilter ? { marketValues: valueFilter } : {},
    ].filter((clause) => Object.keys(clause).length > 0),
  }

  // Prisma does not support direct orderBy on relations with filtering "latest value",
  // so we fetch plus latest value separately and sort in JS for value_desc.
  const baseOrderBy: Prisma.PlayerOrderByWithRelationInput =
    sort === 'name_asc'
      ? { name: Prisma.SortOrder.asc }
      : sort === 'age_asc' || sort === 'age_desc'
      ? { dob: sort === 'age_asc' ? Prisma.SortOrder.desc : Prisma.SortOrder.asc } // younger age => later dob
      : { name: Prisma.SortOrder.asc }

  const [players, total] = await Promise.all([
    db.player.findMany({
      where,
      skip,
      take,
      orderBy: baseOrderBy,
      include: {
        currentTeam: {
          select: { id: true, name: true, badgeUrl: true },
        },
        marketValues: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    }),
    db.player.count({ where }),
  ])

  let enriched = players.map((p) => {
    const age = calculateAge(p.dob ?? null)
    const latestValue = p.marketValues[0]
    return {
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      birthCountry: p.birthCountry,
      position: p.position,
      preferredFoot: p.preferredFoot,
      heightCm: p.heightCm,
      age,
      currentTeam: p.currentTeam,
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
  }

  const totalPages = Math.ceil(total / pageSize)

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages,
    results: enriched,
  })
}

