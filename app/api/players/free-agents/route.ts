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
  position: z.string().optional(),
  freeSince: z.coerce.date().optional(),
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

  const { page, pageSize, sort, nationality, position, freeSince, valueMin, valueMax } = parsed.data

  const skip = (page - 1) * pageSize
  const take = pageSize

  const whereClauses: any[] = [{ currentTeamId: null }]

  if (nationality) {
    whereClauses.push({ nationality: { equals: nationality } })
  }

  if (position) {
    whereClauses.push({ position: { equals: position } })
  }

  const now = new Date()

  const contractEndFilter: any = {
    status: 'EXPIRED',
  }
  if (freeSince) {
    contractEndFilter.endDate = { lte: freeSince }
  } else {
    contractEndFilter.endDate = { lte: now }
  }

  const contractsFilter = {
    some: contractEndFilter,
  }

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
      ...whereClauses,
      { contracts: contractsFilter },
      valueFilter ? { marketValues: valueFilter } : {},
    ].filter((clause) => Object.keys(clause).length > 0),
  }

  const baseOrderBy: Prisma.PlayerOrderByWithRelationInput =
    sort === 'name_asc'
      ? { name: Prisma.SortOrder.asc }
      : sort === 'age_asc' || sort === 'age_desc'
      ? { dob: sort === 'age_asc' ? Prisma.SortOrder.desc : Prisma.SortOrder.asc }
      : { name: Prisma.SortOrder.asc }

  const [players, total] = await Promise.all([
    db.player.findMany({
      where,
      skip,
      take,
      orderBy: baseOrderBy,
      include: {
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
      position: p.position,
      age,
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

