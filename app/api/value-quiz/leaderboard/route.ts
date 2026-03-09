import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcScore } from '@/lib/quizScore'

export async function GET() {
  // Fetch all attempts that have a userId (anonymous attempts are excluded from leaderboard)
  const attempts = await db.valueQuizAttempt.findMany({
    where: { userId: { not: null } },
    select: {
      userId: true,
      actualValueEur: true,
      deltaEur: true,
      user: { select: { id: true, name: true, handle: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Aggregate per user
  const byUser = new Map<string, {
    user: { id: string; name: string; handle: string; avatar: string }
    totalScore: number
    attempts: number
    perfectGuesses: number
  }>()

  for (const a of attempts) {
    if (!a.userId || !a.user) continue
    const score = calcScore(a.actualValueEur, a.deltaEur)
    const existing = byUser.get(a.userId)
    if (existing) {
      existing.totalScore += score
      existing.attempts += 1
      if (score === 100) existing.perfectGuesses += 1
    } else {
      byUser.set(a.userId, {
        user: a.user,
        totalScore: score,
        attempts: 1,
        perfectGuesses: score === 100 ? 1 : 0,
      })
    }
  }

  const ranked = [...byUser.values()]
    .sort((a, b) => b.totalScore - a.totalScore || b.attempts - a.attempts)
    .slice(0, 20)
    .map((entry, i) => ({
      rank: i + 1,
      userId: entry.user.id,
      name: entry.user.name,
      handle: entry.user.handle,
      avatar: entry.user.avatar,
      totalScore: entry.totalScore,
      attempts: entry.attempts,
      perfectGuesses: entry.perfectGuesses,
      avgScore: entry.attempts > 0 ? Math.round(entry.totalScore / entry.attempts) : 0,
    }))

  return NextResponse.json({ leaderboard: ranked })
}
