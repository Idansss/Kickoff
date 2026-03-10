import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlayerHeader } from '@/components/football/player/PlayerHeader'
import { PlayerTabs } from '@/components/football/player/PlayerTabs'
import { db } from '@/lib/db'

interface PlayerPageProps {
  params: { id: string }
}

async function getPlayer(id: string) {
  try {
    return await db.player.findUnique({
      where: { id },
      include: {
        currentTeam: true,
        transfers: {
          include: { fromTeam: true, toTeam: true },
          orderBy: { date: 'desc' },
        },
        contracts: {
          include: { club: true, loanFrom: true, agent: true },
          orderBy: { endDate: 'asc' },
        },
        marketValues: { orderBy: { date: 'desc' }, take: 12 },
        playerAgents: {
          where: { OR: [{ endDate: null }, { endDate: { gt: new Date() } }] },
          include: { agent: true, agency: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })
  } catch {
    return null
  }
}

function calcAge(dob: Date | null): number | null {
  if (!dob) return null
  return Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970)
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const p = await getPlayer(params.id)
  if (!p) return { title: 'Player - KICKOFF' }
  const title = `${p.name} - KICKOFF`
  const description = [p.position, p.nationality].filter(Boolean).join(' · ')
  return { title, description, openGraph: { title, description, siteName: 'KICKOFF' }, twitter: { card: 'summary', title, description } }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const player = await getPlayer(params.id)
  if (!player) notFound()

  const latestTransfer = player.transfers[0]
  const isOnLoan = !!latestTransfer && latestTransfer.type.toLowerCase() === 'loan' && latestTransfer.toTeamId === player.currentTeamId
  const transferStatus = isOnLoan
    ? { type: 'loan', isOnLoan: true, loanFromTeam: latestTransfer.fromTeam ? { id: latestTransfer.fromTeam.id, name: latestTransfer.fromTeam.name } : null }
    : { type: 'permanent', isOnLoan: false }

  const nowDate = new Date()
  const activeContracts = player.contracts.filter((c) => c.status === 'ACTIVE')
  const primaryContract = activeContracts.find((c) => c.endDate > nowDate) ?? activeContracts[0] ?? player.contracts[player.contracts.length - 1]
  const contract = primaryContract
    ? {
        id: primaryContract.id,
        startDate: primaryContract.startDate,
        endDate: primaryContract.endDate,
        status: primaryContract.status,
        isOnLoan: primaryContract.isOnLoan,
        wageEur: primaryContract.wageEur,
        releaseClauseEur: primaryContract.releaseClauseEur,
        club: primaryContract.club ? { id: primaryContract.club.id, name: primaryContract.club.name, badgeUrl: primaryContract.club.badgeUrl } : null,
        loanFromTeam: primaryContract.loanFrom ? { id: primaryContract.loanFrom.id, name: primaryContract.loanFrom.name } : null,
      }
    : null

  const link = player.playerAgents[0]
  const agent = link
    ? {
        agent: link.agent ? { id: link.agent.id, name: link.agent.name, country: link.agent.country } : null,
        agency: link.agency ? { id: link.agency.id, name: link.agency.name, country: link.agency.country } : null,
        since: link.startDate,
      }
    : null

  const latestValue = player.marketValues[0]
  const value = latestValue ? `€${(latestValue.valueEur / 1_000_000).toFixed(1)}m` : null

  const playerData = {
    id: player.id,
    name: player.name,
    photoUrl: player.photoUrl ?? null,
    dob: player.dob,
    age: calcAge(player.dob ?? null),
    nationality: player.nationality,
    preferredFoot: player.preferredFoot,
    position: player.position,
    heightCm: player.heightCm,
    currentTeam: player.currentTeam ? { id: player.currentTeam.id, name: player.currentTeam.name, badgeUrl: player.currentTeam.badgeUrl } : null,
    transfers: player.transfers.map((t) => ({
      id: t.id, date: t.date, type: t.type, fee: t.fee,
      fromTeam: t.fromTeam ? { id: t.fromTeam.id, name: t.fromTeam.name, badgeUrl: t.fromTeam.badgeUrl } : null,
      toTeam: t.toTeam ? { id: t.toTeam.id, name: t.toTeam.name, badgeUrl: t.toTeam.badgeUrl } : null,
    })),
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <PlayerHeader player={playerData} transferStatus={transferStatus} contract={contract} agent={agent} value={value} recentForm={null} />
      <PlayerTabs playerId={params.id} />
    </main>
  )
}
