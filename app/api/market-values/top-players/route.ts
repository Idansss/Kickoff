import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  position: z.string().optional(),
  nationality: z.string().optional(),
  valueMin: z.coerce.number().int().min(0).optional(),
  valueMax: z.coerce.number().int().min(0).optional(),
  teamId: z.string().optional(),
})

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null
  const diffMs = Date.now() - dob.getTime()
  return Math.abs(new Date(diffMs).getUTCFullYear() - 1970)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.format() }, { status: 400 })
  }

  const { page, pageSize, position, nationality, valueMin, valueMax, teamId } = parsed.data
  const now = new Date()

  // Fetch latest snapshot per player via subquery approach:
  // Get the most recent snapshot for every player, then rank.
  // SQLite doesn't support window functions well via Prisma, so we:
  // 1) Find all player IDs matching filters
  // 2) Grab latest snapshot per player in app code

  const playerWhere: Record<string, unknown> = {}
  if (position) playerWhere.position = { contains: position }
  if (nationality) playerWhere.nationality = { contains: nationality }
  if (teamId) playerWhere.currentTeamId = teamId

  const players = await db.player.findMany({
    where: playerWhere,
    include: {
      currentTeam: { select: { id: true, name: true, badgeUrl: true, country: true } },
      marketValues: {
        orderBy: { date: 'desc' },
        take: 2, // latest + previous for delta
      },
    },
  })

  // Build ranked list
  type PlayerEntry = {
    id: string
    name: string
    nationality: string | null
    position: string | null
    age: number | null
    currentTeam: { id: string; name: string; badgeUrl: string | null; country: string | null } | null
    latestValueEur: number
    latestValueFormatted: string
    previousValueEur: number | null
    deltaEur: number | null
    deltaFormatted: string | null
    deltaDirection: 'up' | 'down' | 'flat' | null
    valueDate: Date
  }

  const entries: PlayerEntry[] = []

  for (const p of players) {
    const latest = p.marketValues[0]
    if (!latest) continue
    if (valueMin != null && latest.valueEur < valueMin) continue
    if (valueMax != null && latest.valueEur > valueMax) continue

    const previous = p.marketValues[1] ?? null
    const deltaEur = previous ? latest.valueEur - previous.valueEur : null
    const deltaFormatted = deltaEur != null
      ? `${deltaEur >= 0 ? '+' : ''}€${(deltaEur / 1_000_000).toFixed(1)}m`
      : null

    entries.push({
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      position: p.position,
      age: calculateAge(p.dob ?? null),
      currentTeam: p.currentTeam,
      latestValueEur: latest.valueEur,
      latestValueFormatted: `€${(latest.valueEur / 1_000_000).toFixed(1)}m`,
      previousValueEur: previous?.valueEur ?? null,
      deltaEur,
      deltaFormatted,
      deltaDirection: deltaEur == null ? null : deltaEur > 0 ? 'up' : deltaEur < 0 ? 'down' : 'flat',
      valueDate: latest.date,
    })
  }

  // Sort by value descending
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
