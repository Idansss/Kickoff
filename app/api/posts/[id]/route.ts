import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CURRENT_USER_ID = 'u1'

interface PostRouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_req: NextRequest, context: PostRouteContext): Promise<NextResponse> {
  try {
    const { id: postId } = await context.params

    const post = await db.post.findUnique({ where: { id: postId } })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== CURRENT_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.post.delete({ where: { id: postId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
