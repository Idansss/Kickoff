import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { INPUT_LIMITS } from '@/lib/constants'

const CURRENT_USER_ID = 'u1'

interface ReplyRouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  req: NextRequest,
  context: ReplyRouteContext
): Promise<NextResponse> {
  try {
    const { id: postId } = await context.params
    const { content } = (await req.json()) as { content?: string }
    const normalizedContent = content?.trim() ?? ''

    if (!normalizedContent) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (normalizedContent.length > INPUT_LIMITS.chatMaxLength) {
      return NextResponse.json(
        { error: `Reply exceeds ${INPUT_LIMITS.chatMaxLength} characters` },
        { status: 400 }
      )
    }

    const parent = await db.post.findUnique({ where: { id: postId } })
    if (!parent) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const reply = await db.post.create({
      data: {
        content: normalizedContent,
        authorId: CURRENT_USER_ID,
        parentId: postId,
      },
      include: { author: true },
    })

    return NextResponse.json({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: reply.author,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  context: ReplyRouteContext
): Promise<NextResponse> {
  try {
    const { id: postId } = await context.params

    const replies = await db.post.findMany({
      where: { parentId: postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: true,
        likes: { select: { userId: true } },
      },
    })

    const formatted = replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      likes: r.likes.length,
      isLiked: r.likes.some((l) => l.userId === CURRENT_USER_ID),
      author: r.author,
    }))

    return NextResponse.json(formatted)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}
