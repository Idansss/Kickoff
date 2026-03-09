import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { calcScore, formatValueEur, scoreLabel } from '@/lib/quizScore'

export async function GET() {
  const userId = await getCurrentUserId()

  const where = userId ? { userId } : { userId: null }

  const attempts = await db.valueQuizAttempt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      player: {
        select: {
          id: true,
          name: true,
          position: true,
          photoUrl: true,
          currentTeam: { select: { id: true, name: true, badgeUrl: true } },
        },
      },
    },
  })

  const results = attempts.map((a) => {
    const score = calcScore(a.actualValueEur, a.deltaEur)
    return {
      id: a.id,
      createdAt: a.createdAt,
      player: a.player,
      guessedValueEur: a.guessedValueEur,
      actualValueEur: a.actualValueEur,
      guessedFormatted: formatValueEur(a.guessedValueEur),
      actualFormatted: formatValueEur(a.actualValueEur),
      deltaEur: a.deltaEur,
      deltaFormatted: `${a.deltaEur >= 0 ? '+' : ''}${formatValueEur(Math.abs(a.deltaEur))}`,
      deltaDirection: a.deltaEur > 0 ? 'over' : a.deltaEur < 0 ? 'under' : 'exact',
      score,
      scoreLabel: scoreLabel(score),
      percentageOff: +((Math.abs(a.deltaEur) / a.actualValueEur) * 100).toFixed(1),
    }
  })

  const totalScore = results.reduce((s, r) => s + r.score, 0)
  const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0
  const perfectGuesses = results.filter((r) => r.score === 100).length

  return NextResponse.json({
    attempts: results,
    summary: {
      totalAttempts: results.length,
      totalScore,
      avgScore,
      perfectGuesses,
    },
  })
}
