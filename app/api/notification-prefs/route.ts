import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAuthedUserId } from '@/lib/auth'

const PatchSchema = z.object({
  teamId: z.string().min(1),
  matchStart: z.boolean().optional(),
  goals: z.boolean().optional(),
  redCards: z.boolean().optional(),
  finalScore: z.boolean().optional(),
  transfers: z.boolean().optional(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const json = await req.json()
    const parsed = PatchSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid notification prefs payload' }, { status: 400 })
    }

    const userId = await getAuthedUserId()
    const { teamId, ...rest } = parsed.data

    const pref = await db.notificationPref.upsert({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      update: rest,
      create: {
        userId,
        teamId,
        ...rest,
      },
    })

    return NextResponse.json({ pref })
  } catch {
    return NextResponse.json({ error: 'Failed to update prefs' }, { status: 500 })
  }
}

const DEFAULT_PREFS = {
  matchStart: true,
  goals: true,
  redCards: true,
  finalScore: true,
  transfers: false,
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthedUserId()
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (teamId) {
      const pref = await db.notificationPref.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      })

      if (!pref) {
        return NextResponse.json(DEFAULT_PREFS)
      }

      return NextResponse.json({
        matchStart: pref.matchStart,
        goals: pref.goals,
        redCards: pref.redCards,
        finalScore: pref.finalScore,
        transfers: pref.transfers,
      })
    }

    const prefs = await db.notificationPref.findMany({
      where: { userId },
    })

    return NextResponse.json(
      prefs.map((p) => ({
        teamId: p.teamId,
        matchStart: p.matchStart,
        goals: p.goals,
        redCards: p.redCards,
        finalScore: p.finalScore,
        transfers: p.transfers,
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch prefs' }, { status: 500 })
  }
}

