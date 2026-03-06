import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? 'all' // all | players | teams | posts | users

  if (q.length < 2) return NextResponse.json({ players: [], teams: [], posts: [], users: [] })

  const like = { contains: q, mode: 'insensitive' as const }

  const [players, teams, posts, users] = await Promise.all([
    type === 'all' || type === 'players'
      ? db.player.findMany({
          where: { OR: [{ name: like }, { nationality: like }, { position: like }] },
          take: 8,
          include: { currentTeam: { select: { name: true, badgeUrl: true } } },
        })
      : [],
    type === 'all' || type === 'teams'
      ? db.team.findMany({
          where: { OR: [{ name: like }, { country: like }] },
          take: 8,
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
          take: 8,
        })
      : [],
  ])

  return NextResponse.json({ players, teams, posts, users })
}
