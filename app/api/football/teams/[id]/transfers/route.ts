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

export async function GET(_req: Request, { params }: Params) {
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  }

  const teamId = parsed.data.id

  const transfers = await db.transfer.findMany({
    where: {
      OR: [{ fromTeamId: teamId }, { toTeamId: teamId }],
    },
    include: {
      player: true,
      fromTeam: true,
      toTeam: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  const items = transfers.map((t) => {
    const direction = t.toTeamId === teamId ? 'in' : 'out'
    return {
      id: t.id,
      type: t.type,
      direction,
      fee: t.fee,
      date: t.date,
      player: {
        id: t.player.id,
        name: t.player.name,
        position: t.player.position,
        nationality: t.player.nationality,
      },
      fromTeam: t.fromTeam ? { id: t.fromTeam.id, name: t.fromTeam.name } : null,
      toTeam: t.toTeam ? { id: t.toTeam.id, name: t.toTeam.name } : null,
    }
  })

  return NextResponse.json({ transfers: items })
}

