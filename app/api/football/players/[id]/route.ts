import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

type Params = {
  params: {
    id: string
  }
}

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export async function GET(_req: Request, { params }: Params) {
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid player id' }, { status: 400 })
  }

  const player = await db.player.findUnique({
    where: { id: parsed.data.id },
    include: {
      currentTeam: true,
      transfers: {
        include: {
          fromTeam: true,
          toTeam: true,
        },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!player) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const latestTransfer = player.transfers[0]
  const isOnLoan =
    !!latestTransfer &&
    latestTransfer.type.toLowerCase() === 'loan' &&
    latestTransfer.toTeamId === player.currentTeamId

  const transferStatus = isOnLoan
    ? {
        type: 'loan',
        isOnLoan: true,
        loanFromTeam: latestTransfer.fromTeam
          ? {
              id: latestTransfer.fromTeam.id,
              name: latestTransfer.fromTeam.name,
            }
          : null,
      }
    : {
        type: 'permanent',
        isOnLoan: false,
      }

  const matchLineups = await db.matchLineup.findMany({
    where: { playerId: player.id },
    include: {
      match: true,
    },
    orderBy: {
      match: {
        kickoff: 'desc',
      },
    },
    take: 5,
  })

  const recentRatings = matchLineups
    .map((l) => l.rating)
    .filter((r): r is number => r != null)

  const recentForm =
    recentRatings.length > 0
      ? {
          avgRating: +(recentRatings.reduce((acc, r) => acc + r, 0) / recentRatings.length).toFixed(2),
          matches: recentRatings.length,
        }
      : null

  const age = calculateAge(player.dob ?? null)

  const dto = {
    player: {
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl ?? null,
      dob: player.dob,
      age,
      nationality: player.nationality,
      preferredFoot: player.preferredFoot,
      position: player.position,
      currentTeam: player.currentTeam
        ? {
            id: player.currentTeam.id,
            name: player.currentTeam.name,
            badgeUrl: player.currentTeam.badgeUrl,
          }
        : null,
    },
    transferStatus,
    value: null as string | null,
    recentForm,
  }

  return NextResponse.json(dto)
}

