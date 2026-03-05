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
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  }

  const teamId = parsed.data.id

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      squads: {
        include: {
          player: true,
        },
      },
    },
  })

  if (!team) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const grouped = {
    goalkeepers: [] as unknown[],
    defenders: [] as unknown[],
    midfielders: [] as unknown[],
    forwards: [] as unknown[],
  }

  for (const member of team.squads) {
    const p = member.player
    const pos = (p.position ?? '').toUpperCase()
    const age = calculateAge(p.dob ?? null)

    const dto = {
      id: p.id,
      name: p.name,
      photoUrl: p.photoUrl,
      nationality: p.nationality,
      dob: p.dob,
      age,
      position: p.position,
      preferredFoot: p.preferredFoot,
    }

    if (pos === 'GK') grouped.goalkeepers.push(dto)
    else if (pos === 'DF') grouped.defenders.push(dto)
    else if (pos === 'MF') grouped.midfielders.push(dto)
    else grouped.forwards.push(dto)
  }

  return NextResponse.json({
    coachName: team.coachName,
    ...grouped,
  })
}

