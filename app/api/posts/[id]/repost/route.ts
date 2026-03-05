import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CURRENT_USER_ID = 'u1'

interface RepostRouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  _req: NextRequest,
  context: RepostRouteContext
): Promise<NextResponse> {
  try {
    const { id: postId } = await context.params

    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const existing = await db.userRepost.findUnique({
      where: { postId_userId: { postId, userId: CURRENT_USER_ID } },
    })

    if (existing) {
      await db.userRepost.delete({ where: { id: existing.id } })
    } else {
      await db.userRepost.create({ data: { postId, userId: CURRENT_USER_ID } })
    }

    const repostCount = await db.userRepost.count({ where: { postId } })
    return NextResponse.json({ reposted: !existing, reposts: repostCount })
  } catch {
    return NextResponse.json({ error: 'Failed to toggle repost' }, { status: 500 })
  }
}
