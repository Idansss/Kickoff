import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

const MATCH_ROOM_PREFIX = 'match:'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const roomId = `${MATCH_ROOM_PREFIX}${matchId}`

  try {
    const messages = await db.message.findMany({
      where: { roomId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId()
  const { content } = await request.json() as { content: string }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const { matchId } = await params
  const roomId = `${MATCH_ROOM_PREFIX}${matchId}`

  try {
    const message = await db.message.create({
      data: {
        roomId,
        content: content.trim().slice(0, 280),
        authorId: userId,
      },
      include: { author: true },
    })
    return NextResponse.json(message)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
