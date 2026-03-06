import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()

  try {
    const preds = await db.matchPrediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(preds)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()
  const { matchId, homeGoals, awayGoals, confidence } = body as {
    matchId: string
    homeGoals: number
    awayGoals: number
    confidence?: number
  }

  const outcome =
    homeGoals > awayGoals ? 'home' : homeGoals < awayGoals ? 'away' : 'draw'

  try {
    const pred = await db.matchPrediction.upsert({
      where: { userId_matchId: { userId, matchId } },
      create: {
        userId,
        matchId,
        homeGoals,
        awayGoals,
        confidence: confidence ?? 3,
        outcome,
      },
      update: {
        homeGoals,
        awayGoals,
        confidence: confidence ?? 3,
        outcome,
      },
    })
    return NextResponse.json(pred)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
