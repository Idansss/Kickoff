import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

const ParamsSchema = z.object({ id: z.string().min(1) })

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

const ReplySchema = z.object({
  content: z.string().min(1).max(10_000),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const parsedQuery = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  const { page, pageSize } = parsedQuery.data
  const { id } = parsedParams.data

  const thread = await db.forumThread.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      _count: { select: { posts: true } },
    },
  })

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  const skip = (page - 1) * pageSize
  const [posts, postTotal] = await Promise.all([
    db.forumPost.findMany({
      where: { threadId: id },
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
      include: {
        // no User model relation for anonymous forum posts; authorId may be null
      },
    }),
    db.forumPost.count({ where: { threadId: id } }),
  ])

  // Fetch subscriber count
  const subscriberCount = await db.forumThreadSubscription.count({ where: { threadId: id } })

  // Current user subscription status
  const userId = await getCurrentUserId()
  const isSubscribed = userId
    ? !!(await db.forumThreadSubscription.findFirst({ where: { threadId: id, userId } }))
    : false

  return NextResponse.json({
    thread: {
      id: thread.id,
      title: thread.title,
      isRumour: thread.isRumour,
      relatedClubId: thread.relatedClubId,
      relatedPlayerId: thread.relatedPlayerId,
      category: thread.category,
      tags: thread.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
      totalPosts: thread._count.posts,
      subscriberCount,
      isSubscribed,
      createdAt: thread.createdAt,
    },
    page,
    pageSize,
    totalPosts: postTotal,
    totalPages: Math.ceil(postTotal / pageSize),
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      authorId: p.authorId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ReplySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.format() }, { status: 400 })
  }

  const thread = await db.forumThread.findUnique({ where: { id: parsedParams.data.id } })
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  const userId = await getCurrentUserId()

  const post = await db.forumPost.create({
    data: {
      threadId: parsedParams.data.id,
      content: parsed.data.content,
      authorId: userId,
    },
  })

  // Touch thread's updatedAt
  await db.forumThread.update({
    where: { id: parsedParams.data.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(
    {
      post: {
        id: post.id,
        content: post.content,
        authorId: post.authorId,
        createdAt: post.createdAt,
      },
    },
    { status: 201 },
  )
}
