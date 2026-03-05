import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { INPUT_LIMITS } from '@/lib/constants'

const CURRENT_USER_ID = 'u1'

export async function GET(): Promise<NextResponse> {
  try {
    const posts = await db.post.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        likes: { select: { userId: true } },
        reposts: { select: { userId: true } },
        replyList: { select: { id: true } },
      },
    })

    const formatted = posts.map((post) => ({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      reposts: post.reposts.length,
      replies: post.replyList.length,
      shares: post.shares,
      likes: post.likes.length,
      isLiked: post.likes.some((l) => l.userId === CURRENT_USER_ID),
      isReposted: post.reposts.some((r) => r.userId === CURRENT_USER_ID),
      author: post.author,
      relatedMatchId: post.relatedMatchId,
      relatedPlayerId: post.relatedPlayerId,
    }))

    return NextResponse.json(formatted)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { content } = (await req.json()) as { content?: string }
    const normalizedContent = content?.trim() ?? ''

    if (!normalizedContent) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (normalizedContent.length > INPUT_LIMITS.postMaxLength) {
      return NextResponse.json(
        { error: `Post exceeds ${INPUT_LIMITS.postMaxLength} characters` },
        { status: 400 }
      )
    }

    const post = await db.post.create({
      data: {
        content: normalizedContent,
        authorId: CURRENT_USER_ID,
      },
      include: {
        author: true,
      },
    })

    return NextResponse.json({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      reposts: 0,
      replies: 0,
      shares: 0,
      likes: 0,
      isLiked: false,
      isReposted: false,
      author: post.author,
      relatedMatchId: null,
      relatedPlayerId: null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
