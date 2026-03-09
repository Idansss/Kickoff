import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({ id: z.string().min(1) })

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null
  const diffMs = Date.now() - dob.getTime()
  return Math.abs(new Date(diffMs).getUTCFullYear() - 1970)
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 })
  }

  const agent = await db.agent.findUnique({
    where: { id: parsed.data.id },
    include: {
      agencyMemberships: {
        include: {
          agency: true,
        },
      },
      contracts: {
        include: {
          player: {
            include: {
              currentTeam: { select: { id: true, name: true, badgeUrl: true } },
              marketValues: { orderBy: { date: 'desc' }, take: 1 },
            },
          },
          club: { select: { id: true, name: true, badgeUrl: true } },
        },
        orderBy: { endDate: 'asc' },
      },
      playerAgents: {
        include: {
          player: {
            include: {
              currentTeam: { select: { id: true, name: true, badgeUrl: true } },
              marketValues: { orderBy: { date: 'desc' }, take: 1 },
              contracts: {
                where: { status: 'ACTIVE' },
                orderBy: { endDate: 'asc' },
                take: 1,
              },
            },
          },
          agency: { select: { id: true, name: true } },
        },
        orderBy: { startDate: 'desc' },
      },
    },
  })

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const now = new Date()

  // Split clients into current and past
  const currentClients = agent.playerAgents
    .filter((pa) => pa.player != null && (pa.endDate == null || pa.endDate > now))
    .map((pa) => {
      const p = pa.player!
      const latestValue = p.marketValues[0]
      const activeContract = p.contracts[0]
      return {
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        position: p.position,
        age: calculateAge(p.dob ?? null),
        photoUrl: p.photoUrl,
        currentTeam: p.currentTeam,
        marketValue: latestValue
          ? {
              raw: latestValue.valueEur,
              formatted: `€${(latestValue.valueEur / 1_000_000).toFixed(1)}m`,
              date: latestValue.date,
            }
          : null,
        contract: activeContract
          ? {
              endDate: activeContract.endDate,
              status: activeContract.status,
            }
          : null,
        since: pa.startDate,
      }
    })

  const pastClients = agent.playerAgents
    .filter((pa) => pa.player != null && pa.endDate != null && pa.endDate <= now)
    .map((pa) => {
      const p = pa.player!
      return {
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        position: p.position,
        currentTeam: p.currentTeam,
        until: pa.endDate,
      }
    })

  const totalValueEur = currentClients.reduce(
    (acc, c) => acc + (c.marketValue?.raw ?? 0),
    0,
  )

  const dto = {
    agent: {
      id: agent.id,
      name: agent.name,
      country: agent.country,
      email: agent.email,
      phone: agent.phone,
      agencies: agent.agencyMemberships.map((m) => ({
        id: m.agency.id,
        name: m.agency.name,
        country: m.agency.country,
        website: m.agency.website,
        role: m.role,
        since: m.startDate,
      })),
    },
    stats: {
      currentClientCount: currentClients.length,
      pastClientCount: pastClients.length,
      totalClientValueEur: totalValueEur,
      totalClientValueFormatted:
        totalValueEur > 0 ? `€${(totalValueEur / 1_000_000).toFixed(1)}m` : null,
    },
    currentClients,
    pastClients,
  }

  return NextResponse.json(dto)
}
