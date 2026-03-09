import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const QuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.format() }, { status: 400 })
  }

  const { q, page, pageSize } = parsed.data
  const skip = (page - 1) * pageSize

  const [threads, total] = await Promise.all([
    db.forumThread.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { posts: { some: { content: { contains: q } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        category: { select: { id: true, slug: true, name: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        _count: { select: { posts: true } },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    db.forumThread.count({
      where: {
        OR: [
          { title: { contains: q } },
          { posts: { some: { content: { contains: q } } } },
        ],
      },
    }),
  ])

  return NextResponse.json({
    query: q,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    results: threads.map((t) => ({
      id: t.id,
      title: t.title,
      isRumour: t.isRumour,
      category: t.category,
      tags: t.tags.map((tt) => ({ name: tt.tag.name, slug: tt.tag.slug })),
      replyCount: t._count.posts,
      lastReplyAt: t.posts[0]?.createdAt ?? t.updatedAt,
      createdAt: t.createdAt,
    })),
  })
}
