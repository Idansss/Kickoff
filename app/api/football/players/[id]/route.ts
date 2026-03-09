import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
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
      contracts: {
        include: {
          club: true,
          loanFrom: true,
          agent: true,
        },
        orderBy: { endDate: 'asc' },
      },
      marketValues: {
        orderBy: { date: 'desc' },
        take: 12,
      },
      playerAgents: {
        where: {
          OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
        },
        include: {
          agent: true,
          agency: true,
        },
        orderBy: { startDate: 'desc' },
        take: 1,
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

  // contract summary: choose nearest active (or latest) contract
  const nowDate = new Date()
  const activeContracts = player.contracts.filter((c) => c.status === 'ACTIVE')
  const primaryContract =
    activeContracts.find((c) => c.endDate > nowDate) ?? activeContracts[0] ?? player.contracts[player.contracts.length - 1]

  const contract =
    primaryContract &&
    ({
      id: primaryContract.id,
      startDate: primaryContract.startDate,
      endDate: primaryContract.endDate,
      status: primaryContract.status,
      isOnLoan: primaryContract.isOnLoan,
      wageEur: primaryContract.wageEur,
      releaseClauseEur: primaryContract.releaseClauseEur,
      extensionOptionDate: primaryContract.extensionOptionDate,
      club: primaryContract.club
        ? {
            id: primaryContract.club.id,
            name: primaryContract.club.name,
            badgeUrl: primaryContract.club.badgeUrl,
          }
        : null,
      loanFromTeam: primaryContract.loanFrom
        ? {
            id: primaryContract.loanFrom.id,
            name: primaryContract.loanFrom.name,
          }
        : null,
    } as const)

  // current agent/agency summary
  const currentAgentLink = player.playerAgents[0]
  const agentSummary = currentAgentLink
    ? {
        agent: currentAgentLink.agent
          ? {
              id: currentAgentLink.agent.id,
              name: currentAgentLink.agent.name,
              country: currentAgentLink.agent.country,
            }
          : null,
        agency: currentAgentLink.agency
          ? {
              id: currentAgentLink.agency.id,
              name: currentAgentLink.agency.name,
              country: currentAgentLink.agency.country,
            }
          : null,
        since: currentAgentLink.startDate,
      }
    : null

  // market value summary (latest + delta vs previous)
  const latestValue = player.marketValues[0]
  const previousValue = player.marketValues[1]
  const valueSummary =
    latestValue &&
    ({
      formatted: `€${(latestValue.valueEur / 1_000_000).toFixed(1)}m`,
      raw: latestValue.valueEur,
      currency: latestValue.currency,
      date: latestValue.date,
      changeSincePrevious: previousValue ? latestValue.valueEur - previousValue.valueEur : null,
    } as const)

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
      heightCm: player.heightCm,
      currentTeam: player.currentTeam
        ? {
            id: player.currentTeam.id,
            name: player.currentTeam.name,
            badgeUrl: player.currentTeam.badgeUrl,
          }
        : null,
      transfers: player.transfers.map((t) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        fee: t.fee,
        fromTeam: t.fromTeam
          ? {
              id: t.fromTeam.id,
              name: t.fromTeam.name,
              badgeUrl: t.fromTeam.badgeUrl,
            }
          : null,
        toTeam: t.toTeam
          ? {
              id: t.toTeam.id,
              name: t.toTeam.name,
              badgeUrl: t.toTeam.badgeUrl,
            }
          : null,
      })),
    },
    transferStatus,
    contract,
    agent: agentSummary,
    value: valueSummary ? valueSummary.formatted : (null as string | null),
    valueDetail: valueSummary,
    recentForm,
  }

  return NextResponse.json(dto)
}

