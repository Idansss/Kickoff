import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { calcScore, formatValueEur, scoreLabel } from '@/lib/quizScore'

const BodySchema = z.object({
  playerId: z.string().min(1),
  guessedValueEur: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.format() }, { status: 400 })
  }

  const { playerId, guessedValueEur } = parsed.data

  // Look up actual latest market value
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      name: true,
      marketValues: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { valueEur: true, date: true },
      },
    },
  })

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  const latestSnapshot = player.marketValues[0]
  if (!latestSnapshot) {
    return NextResponse.json({ error: 'No market value data for this player' }, { status: 422 })
  }

  const actualValueEur = latestSnapshot.valueEur
  const deltaEur = guessedValueEur - actualValueEur
  const score = calcScore(actualValueEur, deltaEur)

  const userId = await getCurrentUserId()

  // Persist attempt
  await db.valueQuizAttempt.create({
    data: {
      playerId,
      guessedValueEur,
      actualValueEur,
      deltaEur,
      userId: userId ?? null,
    },
  })

  return NextResponse.json({
    playerId,
    playerName: player.name,
    guessedValueEur,
    actualValueEur,
    guessedFormatted: formatValueEur(guessedValueEur),
    actualFormatted: formatValueEur(actualValueEur),
    deltaEur,
    deltaFormatted: `${deltaEur >= 0 ? '+' : ''}${formatValueEur(Math.abs(deltaEur))}`,
    deltaDirection: deltaEur > 0 ? 'over' : deltaEur < 0 ? 'under' : 'exact',
    score,
    scoreLabel: scoreLabel(score),
    percentageOff: +((Math.abs(deltaEur) / actualValueEur) * 100).toFixed(1),
  })
}
