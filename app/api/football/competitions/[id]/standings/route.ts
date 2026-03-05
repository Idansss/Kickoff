import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid competition id' }, { status: 400 })
  }

  const competitionId = parsed.data.id

  const rows = await (db as any).standingRow?.findMany?.({
    where: { competitionId },
    include: {
      team: true,
    },
    orderBy: {
      position: 'asc',
    },
  })

  const mapped =
    (rows ?? []).map((row: any) => ({
      position: row.position,
      team: {
        id: row.team.id,
        name: row.team.name,
        badgeUrl: row.team.badgeUrl,
      },
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDiff: row.goalDiff,
      points: row.points,
      form: row.form ?? undefined,
    })) ?? []

  return NextResponse.json({ rows: mapped })
}

