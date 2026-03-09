import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({ id: z.string().min(1) })

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid club id' }, { status: 400 })
  }

  const team = await db.team.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, name: true },
  })

  if (!team) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const snapshots = await db.marketValueSnapshot.findMany({
    where: { teamId: parsed.data.id, playerId: null },
    orderBy: { date: 'asc' },
  })

  const history = snapshots.map((s) => ({
    date: s.date.toISOString(),
    valueEur: s.valueEur,
    formatted: `€${(s.valueEur / 1_000_000).toFixed(0)}m`,
    source: s.source,
  }))

  const latest = history[history.length - 1] ?? null
  const earliest = history[0] ?? null
  const allTimeHigh = history.length > 0
    ? history.reduce((max, h) => (h.valueEur > max.valueEur ? h : max), history[0])
    : null

  return NextResponse.json({
    teamId: team.id,
    teamName: team.name,
    history,
    summary: {
      latest: latest ? { value: latest.formatted, date: latest.date } : null,
      earliest: earliest ? { value: earliest.formatted, date: earliest.date } : null,
      allTimeHigh: allTimeHigh ? { value: allTimeHigh.formatted, date: allTimeHigh.date } : null,
      totalChange:
        latest && earliest
          ? {
              deltaEur: latest.valueEur - earliest.valueEur,
              formatted: `${latest.valueEur >= earliest.valueEur ? '+' : ''}€${((latest.valueEur - earliest.valueEur) / 1_000_000).toFixed(0)}m`,
            }
          : null,
    },
  })
}
