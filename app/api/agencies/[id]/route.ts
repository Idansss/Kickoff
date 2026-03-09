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
    return NextResponse.json({ error: 'Invalid agency id' }, { status: 400 })
  }

  const agency = await db.agency.findUnique({
    where: { id: parsed.data.id },
    include: {
      agents: {
        include: {
          agent: {
            include: {
              playerAgents: {
                where: {
                  OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
                },
                select: { id: true },
              },
            },
          },
        },
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
          agent: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!agency) {
    return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
  }

  const now = new Date()

  const currentClients = agency.playerAgents
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
        agent: pa.agent ? { id: pa.agent.id, name: pa.agent.name } : null,
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

  // Sort clients by value descending
  currentClients.sort((a, b) => (b.marketValue?.raw ?? 0) - (a.marketValue?.raw ?? 0))

  const totalValueEur = currentClients.reduce(
    (acc, c) => acc + (c.marketValue?.raw ?? 0),
    0,
  )

  const dto = {
    agency: {
      id: agency.id,
      name: agency.name,
      country: agency.country,
      website: agency.website,
    },
    agents: agency.agents.map((m) => ({
      id: m.agent.id,
      name: m.agent.name,
      country: m.agent.country,
      email: m.agent.email,
      role: m.role,
      since: m.startDate,
      activeClientCount: m.agent.playerAgents.length,
    })),
    stats: {
      agentCount: agency.agents.length,
      currentClientCount: currentClients.length,
      totalClientValueEur: totalValueEur,
      totalClientValueFormatted:
        totalValueEur > 0 ? `€${(totalValueEur / 1_000_000).toFixed(1)}m` : null,
    },
    currentClients,
  }

  return NextResponse.json(dto)
}
