import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (q.length < 1) return NextResponse.json([])

  const like = { contains: q, mode: 'insensitive' as const }

  const [players, teams, competitions, agents, agencies, users] = await Promise.all([
    db.player.findMany({
      where: { name: like },
      take: 4,
      select: { id: true, name: true, position: true, currentTeam: { select: { name: true, badgeUrl: true } } },
    }),
    db.team.findMany({
      where: { name: like },
      take: 3,
      select: { id: true, name: true, badgeUrl: true, country: true },
    }),
    db.competition.findMany({
      where: { name: like },
      take: 2,
      select: { id: true, name: true, country: true, logoUrl: true },
    }),
    db.agent.findMany({
      where: { name: like },
      take: 2,
      select: { id: true, name: true, country: true },
    }),
    db.agency.findMany({
      where: { name: like },
      take: 2,
      select: { id: true, name: true, country: true },
    }),
    db.user.findMany({
      where: { OR: [{ name: like }, { handle: like }] },
      take: 2,
      select: { id: true, name: true, handle: true },
    }),
  ])

  const suggestions = [
    ...players.map(p => ({ type: 'player' as const, id: p.id, label: p.name, sublabel: [p.position, p.currentTeam?.name].filter(Boolean).join(' · '), href: `/player/${p.id}`, badgeUrl: p.currentTeam?.badgeUrl ?? null })),
    ...teams.map(t => ({ type: 'team' as const, id: t.id, label: t.name, sublabel: t.country ?? 'Club', href: `/club/${t.id}`, badgeUrl: t.badgeUrl ?? null })),
    ...competitions.map(c => ({ type: 'competition' as const, id: c.id, label: c.name, sublabel: c.country ?? 'Competition', href: `/competition/${c.id}`, badgeUrl: c.logoUrl ?? null })),
    ...agents.map(a => ({ type: 'agent' as const, id: a.id, label: a.name, sublabel: a.country ?? 'Agent', href: `/agents/${a.id}`, badgeUrl: null })),
    ...agencies.map(a => ({ type: 'agency' as const, id: a.id, label: a.name, sublabel: a.country ?? 'Agency', href: `/agencies/${a.id}`, badgeUrl: null })),
    ...users.map(u => ({ type: 'user' as const, id: u.id, label: u.name, sublabel: `@${u.handle}`, href: `/user/${u.id}`, badgeUrl: null })),
  ]

  return NextResponse.json(suggestions)
}
