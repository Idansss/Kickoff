import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FALLBACK_CATEGORIES = [
  {
    id: 'general',
    slug: 'general',
    name: 'General discussion',
    description: 'Anything and everything about the beautiful game.',
    threadCount: 0,
    latestActivity: null,
  },
  {
    id: 'transfers',
    slug: 'transfers',
    name: 'Transfers & rumours',
    description: 'Transfer news, gossip, and completed deals.',
    threadCount: 0,
    latestActivity: null,
  },
  {
    id: 'tactics',
    slug: 'tactics',
    name: 'Tactics & analysis',
    description: 'Deep dives, systems, and data-driven talk.',
    threadCount: 0,
    latestActivity: null,
  },
  {
    id: 'matchday',
    slug: 'matchday',
    name: 'Matchday threads',
    description: 'Live reaction and post‑match takes.',
    threadCount: 0,
    latestActivity: null,
  },
  {
    id: 'fantasy',
    slug: 'fantasy',
    name: 'Fantasy & betting',
    description: 'Line‑ups, chips, and predictions chat.',
    threadCount: 0,
    latestActivity: null,
  },
  {
    id: 'international',
    slug: 'international',
    name: 'International football',
    description: 'Euros, World Cup, and national‑team talk.',
    threadCount: 0,
    latestActivity: null,
  },
] as const

export async function GET() {
  try {
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

    // If DB is empty, return an empty list so the UI shows the “no categories yet” state.
    if (result.length === 0) {
      return NextResponse.json({ categories: [] })
    }

    return NextResponse.json({ categories: result })
  } catch (error) {
    // In production (e.g. missing migrations / DB down), fall back to a curated static set
    console.error('Error loading forum categories', error)
    return NextResponse.json({ categories: FALLBACK_CATEGORIES })
  }
}
