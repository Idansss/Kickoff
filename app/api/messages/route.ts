import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { INPUT_LIMITS } from '@/lib/constants'

const CURRENT_USER_ID = 'u1'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    }

    const messages = await db.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: { author: true },
      take: 100,
    })

    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { roomId, content } = (await req.json()) as {
      roomId?: string
      content?: string
    }
    const normalizedContent = content?.trim() ?? ''

    if (!roomId?.trim() || !normalizedContent) {
      return NextResponse.json({ error: 'roomId and content are required' }, { status: 400 })
    }

    if (normalizedContent.length > INPUT_LIMITS.chatMaxLength) {
      return NextResponse.json(
        { error: `Message exceeds ${INPUT_LIMITS.chatMaxLength} characters` },
        { status: 400 }
      )
    }

    const message = await db.message.create({
      data: {
        roomId: roomId.trim(),
        content: normalizedContent,
        authorId: CURRENT_USER_ID,
      },
      include: { author: true },
    })

    return NextResponse.json(message)
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
