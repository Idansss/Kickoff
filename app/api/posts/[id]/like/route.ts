import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CURRENT_USER_ID = 'u1'

interface LikeRouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  _req: NextRequest,
  context: LikeRouteContext
): Promise<NextResponse> {
  try {
    const { id: postId } = await context.params

    const existing = await db.like.findUnique({
      where: { postId_userId: { postId, userId: CURRENT_USER_ID } },
    })

    if (existing) {
      await db.like.delete({ where: { id: existing.id } })
    } else {
      await db.like.create({ data: { postId, userId: CURRENT_USER_ID } })
    }

    const likeCount = await db.like.count({ where: { postId } })

    return NextResponse.json({ liked: !existing, likes: likeCount })
  } catch {
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
