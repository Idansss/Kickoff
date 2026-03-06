import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// Stories: ephemeral posts that expire 24h after creation
// We reuse the Post model with a special tag/relatedMatchId = '__story__'
// and filter by createdAt > now - 24h

const STORY_TAG = '__story__'
const TTL_MS = 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const since = new Date(Date.now() - TTL_MS)
    const stories = await db.post.findMany({
      where: {
        relatedMatchId: STORY_TAG,
        createdAt: { gte: since },
      },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(stories)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()
  const { content, image } = body as { content: string; image?: string }

  if (!content?.trim() && !image) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  try {
    const story = await db.post.create({
      data: {
        content: content?.trim() ?? '',
        image,
        authorId: userId,
        relatedMatchId: STORY_TAG,
      },
      include: { author: true },
    })
    return NextResponse.json(story)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
