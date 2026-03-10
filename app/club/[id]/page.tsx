import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { TeamHeader } from '@/components/football/team/TeamHeader'
import { TeamTabs } from '@/components/football/team/TeamTabs'
import { db } from '@/lib/db'

interface ClubPageProps {
  params: { id: string }
}

async function getTeam(id: string) {
  try {
    const team = await db.team.findUnique({
      where: { id },
      include: {
        contracts: { include: { player: true } },
        marketValues: { orderBy: { date: 'desc' }, take: 12 },
      },
    })
    if (!team) return null

    const finishedMatches = await db.match.findMany({
      where: { status: 'FINISHED', OR: [{ homeTeamId: id }, { awayTeamId: id }] },
      orderBy: { kickoff: 'desc' },
      take: 5,
    })

    const form = finishedMatches.map((m) => {
      const isHome = m.homeTeamId === id
      const gf = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
      const ga = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
      return gf > ga ? 'W' : gf === ga ? 'D' : 'L'
    })

    const allFinished = await db.match.findMany({
      where: { status: 'FINISHED', OR: [{ homeTeamId: id }, { awayTeamId: id }] },
    })

    let tableSnapshot = null
    if (allFinished.length > 0) {
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, points = 0
      for (const m of allFinished) {
        const isHome = m.homeTeamId === id
        const gf = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
        const ga = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
        goalsFor += gf; goalsAgainst += ga
        if (gf > ga) { wins++; points += 3 } else if (gf === ga) { draws++; points++ } else { losses++ }
      }
      tableSnapshot = { played: allFinished.length, wins, draws, losses, goalsFor, goalsAgainst, points }
    }

    const latestClubValue = team.marketValues[0] ?? null

    return {
      id: team.id,
      name: team.name,
      badgeUrl: team.badgeUrl,
      country: team.country,
      venue: team.venue,
      coachName: team.coachName,
      form,
      tableSnapshot,
      valueSummary: latestClubValue
        ? { formatted: `€${(latestClubValue.valueEur / 1_000_000).toFixed(1)}m`, raw: latestClubValue.valueEur, currency: latestClubValue.currency, date: latestClubValue.date }
        : null,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const team = await getTeam(params.id)
  if (!team) return { title: 'Club - KICKOFF' }
  const title = `${team.name} - KICKOFF`
  const description = team.country ? `${team.name} · ${team.country} football club on KICKOFF` : `${team.name} on KICKOFF`
  return { title, description, openGraph: { title, description, siteName: 'KICKOFF' }, twitter: { card: 'summary', title, description } }
}

export default async function ClubPage({ params }: ClubPageProps) {
  const team = await getTeam(params.id)
  if (!team) notFound()

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <TeamHeader team={team} />
        <TeamTabs teamId={params.id} />
      </div>
    </AppLayout>
  )
}
