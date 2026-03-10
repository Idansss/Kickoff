import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? 'all'

  if (q.length < 2) return NextResponse.json({ players: [], teams: [], posts: [], users: [], competitions: [], agents: [], agencies: [], threads: [] })

  const like = { contains: q, mode: 'insensitive' as const }

  const [players, teams, posts, users, competitions, agents, agencies, threads] = await Promise.all([
    type === 'all' || type === 'players'
      ? db.player.findMany({
          where: { OR: [{ name: like }, { nationality: like }, { position: like }] },
          take: 10,
          include: { currentTeam: { select: { id: true, name: true, badgeUrl: true } } },
        })
      : [],
    type === 'all' || type === 'teams'
      ? db.team.findMany({
          where: { OR: [{ name: like }, { country: like }] },
          take: 10,
        })
      : [],
    type === 'all' || type === 'posts'
      ? db.post.findMany({
          where: { content: like },
          take: 10,
          include: { author: { select: { id: true, name: true, handle: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [],
    type === 'all' || type === 'users'
      ? db.user.findMany({
          where: { OR: [{ name: like }, { handle: like }] },
          take: 10,
        })
      : [],
    type === 'all' || type === 'competitions'
      ? db.competition.findMany({
          where: { OR: [{ name: like }, { country: like }] },
          take: 8,
        })
      : [],
    type === 'all' || type === 'agents'
      ? db.agent.findMany({
          where: { OR: [{ name: like }, { country: like }] },
          take: 8,
        })
      : [],
    type === 'all' || type === 'agencies'
      ? db.agency.findMany({
          where: { OR: [{ name: like }, { country: like }] },
          take: 8,
        })
      : [],
    type === 'all' || type === 'forums'
      ? db.forumThread.findMany({
          where: { OR: [{ title: like }, { posts: { some: { content: like } } }] },
          take: 8,
          include: { category: { select: { slug: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [],
  ])

  // Enrich threads with author name from User table via authorId
  const enrichedThreads = await Promise.all(
    (threads as Awaited<typeof threads>).map(async (t) => {
      const author = t.authorId
        ? await db.user.findUnique({ where: { id: t.authorId }, select: { name: true, handle: true } })
        : null
      return { ...t, author: author ?? { name: 'Anonymous', handle: 'anon' } }
    })
  )

  return NextResponse.json({ players, teams, posts, users, competitions, agents, agencies, threads: enrichedThreads })
}
