import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

const ParamsSchema = z.object({ category: z.string().min(1) })

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['latest', 'oldest', 'replies']).optional().default('latest'),
  search: z.string().optional(),
  tag: z.string().optional(),
})

const CreateThreadSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(10_000),
  isRumour: z.boolean().optional().default(false),
  relatedClubId: z.string().optional(),
  relatedPlayerId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ category: string }> },
) {
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const parsedQuery = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsedQuery.error.format() }, { status: 400 })
  }

  const { page, pageSize, sort, search, tag } = parsedQuery.data
  const slug = parsedParams.data.category

  const category = await db.forumCategory.findUnique({ where: { slug } })
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const threadWhere: Record<string, unknown> = { categoryId: category.id }
  if (search) {
    threadWhere.title = { contains: search }
  }
  if (tag) {
    threadWhere.tags = {
      some: {
        tag: { slug: tag },
      },
    }
  }

  const orderBy =
    sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : sort === 'replies'
      ? { updatedAt: 'desc' as const }
      : { updatedAt: 'desc' as const }

  const skip = (page - 1) * pageSize

  const [threads, total] = await Promise.all([
    db.forumThread.findMany({
      where: threadWhere,
      orderBy,
      skip,
      take: pageSize,
      include: {
        tags: {
          include: { tag: { select: { name: true, slug: true } } },
        },
        _count: { select: { posts: true } },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    db.forumThread.count({ where: threadWhere }),
  ])

  const results = threads.map((t) => ({
    id: t.id,
    title: t.title,
    isRumour: t.isRumour,
    replyCount: t._count.posts,
    tags: t.tags.map((tt) => ({ name: tt.tag.name, slug: tt.tag.slug })),
    createdAt: t.createdAt,
    lastReplyAt: t.posts[0]?.createdAt ?? t.updatedAt,
    relatedClubId: t.relatedClubId,
    relatedPlayerId: t.relatedPlayerId,
  }))

  return NextResponse.json({
    category: {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
    },
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    results,
  })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ category: string }> },
) {
  const params = await context.params
  const parsedParams = ParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateThreadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.format() }, { status: 400 })
  }

  const slug = parsedParams.data.category
  const category = await db.forumCategory.findUnique({ where: { slug } })
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const userId = await getCurrentUserId()

  const { title, body: postBody, isRumour, relatedClubId, relatedPlayerId, tags } = parsed.data

  // Resolve or create tags
  const resolvedTagIds: string[] = []
  for (const tagName of tags) {
    const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
    const existing = await db.forumTag.upsert({
      where: { slug: tagSlug },
      update: {},
      create: { name: tagName, slug: tagSlug },
    })
    resolvedTagIds.push(existing.id)
  }

  const thread = await db.forumThread.create({
    data: {
      categoryId: category.id,
      title,
      authorId: userId,
      isRumour: isRumour ?? false,
      relatedClubId: relatedClubId ?? null,
      relatedPlayerId: relatedPlayerId ?? null,
      posts: {
        create: {
          content: postBody,
          authorId: userId,
        },
      },
      tags: {
        create: resolvedTagIds.map((tagId) => ({ tagId })),
      },
    },
    include: {
      _count: { select: { posts: true } },
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(
    {
      thread: {
        id: thread.id,
        title: thread.title,
        categorySlug: slug,
        replyCount: thread._count.posts,
        tags: thread.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
        createdAt: thread.createdAt,
      },
    },
    { status: 201 },
  )
}
