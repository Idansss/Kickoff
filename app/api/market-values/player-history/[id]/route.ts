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
    return NextResponse.json({ error: 'Invalid player id' }, { status: 400 })
  }

  const player = await db.player.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, name: true },
  })

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  const snapshots = await db.marketValueSnapshot.findMany({
    where: { playerId: parsed.data.id },
    orderBy: { date: 'asc' },
  })

  const history = snapshots.map((s) => ({
    date: s.date.toISOString(),
    valueEur: s.valueEur,
    formatted: `€${(s.valueEur / 1_000_000).toFixed(1)}m`,
    source: s.source,
  }))

  const latest = history[history.length - 1] ?? null
  const earliest = history[0] ?? null
  const allTimeHigh = history.length > 0
    ? history.reduce((max, h) => (h.valueEur > max.valueEur ? h : max), history[0])
    : null

  return NextResponse.json({
    playerId: player.id,
    playerName: player.name,
    history,
    summary: {
      latest: latest ? { value: latest.formatted, date: latest.date } : null,
      earliest: earliest ? { value: earliest.formatted, date: earliest.date } : null,
      allTimeHigh: allTimeHigh ? { value: allTimeHigh.formatted, date: allTimeHigh.date } : null,
      totalChange:
        latest && earliest
          ? {
              deltaEur: latest.valueEur - earliest.valueEur,
              formatted: `${latest.valueEur >= earliest.valueEur ? '+' : ''}€${((latest.valueEur - earliest.valueEur) / 1_000_000).toFixed(1)}m`,
            }
          : null,
    },
  })
}
