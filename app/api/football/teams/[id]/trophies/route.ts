import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

type Params = {
  params: {
    id: string
  }
}

export async function GET(_req: Request, { params }: Params) {
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  }

  const teamId = parsed.data.id

  const trophies = await db.trophy.findMany({
    where: { teamId },
    include: {
      competition: true,
    },
    orderBy: {
      seasonLabel: 'desc',
    },
  })

  const grouped: Record<
    string,
    {
      competitionId: string | null
      competitionName: string
      items: { seasonLabel: string | null; count: number }[]
    }
  > = {}

  for (const t of trophies) {
    const key = t.competitionId ?? 'unknown'
    if (!grouped[key]) {
      grouped[key] = {
        competitionId: t.competitionId ?? null,
        competitionName: t.competition?.name ?? 'Unknown competition',
        items: [],
      }
    }
    grouped[key].items.push({
      seasonLabel: t.seasonLabel ?? null,
      count: t.count,
    })
  }

  return NextResponse.json({ trophiesByCompetition: Object.values(grouped) })
}

