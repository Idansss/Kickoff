import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const categories = await db.forumCategory.findMany({
    include: {
      threads: {
        include: {
          posts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, authorId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const result = categories.map((cat) => {
    const threadCount = cat.threads.length
    const latestThread = cat.threads[0] ?? null
    const latestPost = latestThread?.posts[0] ?? null

    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      threadCount,
      latestActivity: latestPost?.createdAt ?? latestThread?.updatedAt ?? null,
    }
  })

  return NextResponse.json({ categories: result })
}
