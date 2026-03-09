import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  country: z.string().optional(),
  sort: z
    .enum(['clients_desc', 'value_desc', 'name_asc'])
    .optional()
    .default('clients_desc'),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = Object.fromEntries(searchParams.entries())
  const parsed = QuerySchema.safeParse(rawQuery)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.format() }, { status: 400 })
  }

  const { page, pageSize, search, country, sort } = parsed.data

  const where: Record<string, unknown> = {}
  if (search) where.name = { contains: search }
  if (country) where.country = { contains: country }

  const now = new Date()

  // Fetch all matching agents (dataset is small; sort + paginate in app)
  const [allAgents, total] = await Promise.all([
    db.agent.findMany({
      where,
      include: {
        agencyMemberships: {
          include: {
            agency: { select: { id: true, name: true, country: true } },
          },
        },
        playerAgents: {
          where: {
            OR: [{ endDate: null }, { endDate: { gt: now } }],
          },
          include: {
            player: {
              include: {
                marketValues: {
                  orderBy: { date: 'desc' },
                  take: 1,
                },
                currentTeam: { select: { id: true, name: true, badgeUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    db.agent.count({ where }),
  ])

  // Enrich with computed stats
  const enriched = allAgents.map((a) => {
    const clients = a.playerAgents.filter((pa) => pa.player != null)
    const totalValueEur = clients.reduce(
      (acc, pa) => acc + (pa.player?.marketValues[0]?.valueEur ?? 0),
      0,
    )
    return {
      id: a.id,
      name: a.name,
      country: a.country,
      email: a.email,
      phone: a.phone,
      agencies: a.agencyMemberships.map((m) => ({
        id: m.agency.id,
        name: m.agency.name,
        country: m.agency.country,
        role: m.role,
      })),
      clientCount: clients.length,
      totalClientValueEur: totalValueEur,
      totalClientValueFormatted:
        totalValueEur > 0 ? `€${(totalValueEur / 1_000_000).toFixed(1)}m` : null,
    }
  })

  // Sort
  if (sort === 'clients_desc') {
    enriched.sort((a, b) => b.clientCount - a.clientCount)
  } else if (sort === 'value_desc') {
    enriched.sort((a, b) => b.totalClientValueEur - a.totalClientValueEur)
  } else {
    enriched.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Paginate
  const skip = (page - 1) * pageSize
  const results = enriched.slice(skip, skip + pageSize)
  const totalPages = Math.ceil(total / pageSize)

  return NextResponse.json({ page, pageSize, total, totalPages, results })
}
