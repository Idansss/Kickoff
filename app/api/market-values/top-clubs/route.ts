import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  country: z.string().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.format() }, { status: 400 })
  }

  const { page, pageSize, country } = parsed.data

  const teamWhere: Record<string, unknown> = {}
  if (country) teamWhere.country = { contains: country }

  const teams = await db.team.findMany({
    where: teamWhere,
    include: {
      marketValues: {
        orderBy: { date: 'desc' },
        take: 2,
      },
    },
  })

  type ClubEntry = {
    id: string
    name: string
    badgeUrl: string | null
    country: string | null
    latestValueEur: number
    latestValueFormatted: string
    previousValueEur: number | null
    deltaEur: number | null
    deltaFormatted: string | null
    deltaDirection: 'up' | 'down' | 'flat' | null
    valueDate: Date
  }

  const entries: ClubEntry[] = []

  for (const t of teams) {
    const latest = t.marketValues[0]
    if (!latest) continue

    const previous = t.marketValues[1] ?? null
    const deltaEur = previous ? latest.valueEur - previous.valueEur : null
    const deltaFormatted = deltaEur != null
      ? `${deltaEur >= 0 ? '+' : ''}€${(deltaEur / 1_000_000).toFixed(1)}m`
      : null

    entries.push({
      id: t.id,
      name: t.name,
      badgeUrl: t.badgeUrl,
      country: t.country,
      latestValueEur: latest.valueEur,
      latestValueFormatted: `€${(latest.valueEur / 1_000_000).toFixed(1)}m`,
      previousValueEur: previous?.valueEur ?? null,
      deltaEur,
      deltaFormatted,
      deltaDirection: deltaEur == null ? null : deltaEur > 0 ? 'up' : deltaEur < 0 ? 'down' : 'flat',
      valueDate: latest.date,
    })
  }

  entries.sort((a, b) => b.latestValueEur - a.latestValueEur)

  const total = entries.length
  const totalPages = Math.ceil(total / pageSize)
  const skip = (page - 1) * pageSize
  const results = entries.slice(skip, skip + pageSize).map((e, i) => ({
    rank: skip + i + 1,
    ...e,
    valueDate: e.valueDate.toISOString(),
  }))

  return NextResponse.json({ page, pageSize, total, totalPages, results })
}
