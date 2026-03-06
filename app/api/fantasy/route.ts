import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()

  try {
    const team = await db.fantasyTeam.findUnique({ where: { userId } })
    if (!team) {
      return NextResponse.json({ squad: [], budget: 100, teamName: 'My Fantasy XI' })
    }
    return NextResponse.json({
      squad: JSON.parse(team.squadJson),
      budget: team.budget,
      teamName: team.teamName,
    })
  } catch {
    return NextResponse.json({ squad: [], budget: 100, teamName: 'My Fantasy XI' })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()
  const { squad, budget, teamName } = body as {
    squad: unknown[]
    budget: number
    teamName: string
  }

  try {
    const team = await db.fantasyTeam.upsert({
      where: { userId },
      create: {
        userId,
        squadJson: JSON.stringify(squad ?? []),
        budget: budget ?? 100,
        teamName: teamName ?? 'My Fantasy XI',
      },
      update: {
        squadJson: JSON.stringify(squad ?? []),
        budget: budget ?? 100,
        teamName: teamName ?? 'My Fantasy XI',
      },
    })
    return NextResponse.json({ ok: true, id: team.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
