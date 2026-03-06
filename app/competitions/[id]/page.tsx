import { AppLayout } from '@/components/app-layout'
import { CompetitionHeader } from '@/components/football/competition/CompetitionHeader'
import { CompetitionTabs } from '@/components/football/competition/CompetitionTabs'
import { db } from '@/lib/db'

interface CompetitionOverviewResponse {
  competition: {
    id: string
    name: string
    country: string | null
    type: string | null
    logoUrl: string | null
  }
  activeSeason: {
    id: string
    yearStart: number
    yearEnd: number
  } | null
  teamsCount: number
  matchesCount: number
  currentRound: string
}

interface CompetitionPageProps {
  params: Promise<{
    id: string
  }> | {
    id: string
  }
}

async function fetchOverview(id: string): Promise<CompetitionOverviewResponse | null> {
  try {
    const competition = await db.competition.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        country: true,
        type: true,
        logoUrl: true,
      },
    })

    if (!competition) return null

    const activeSeason = await db.season.findFirst({
      where: { competitionId: id },
      orderBy: { yearStart: 'desc' },
      select: {
        id: true,
        yearStart: true,
        yearEnd: true,
      },
    })

    const matches = await db.match.findMany({
      where: {
        competitionId: id,
        ...(activeSeason ? { seasonId: activeSeason.id } : {}),
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
      },
    })

    const teamIds = new Set<string>()
    for (const match of matches) {
      teamIds.add(match.homeTeamId)
      teamIds.add(match.awayTeamId)
    }

    return {
      competition,
      activeSeason,
      teamsCount: teamIds.size,
      matchesCount: matches.length,
      currentRound: 'Matchday 1',
    }
  } catch {
    return null
  }
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const resolvedParams = await params
  const data = await fetchOverview(resolvedParams.id)

  if (!data) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl border-x border-border">
          <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
            <h1 className="text-xl font-bold">Competition unavailable</h1>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load this competition right now.
            </p>
          </div>
          <main className="space-y-4 p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">
              Please try again later or go back to the competitions list.
            </p>
            <a
              href="/competitions"
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60"
            >
              Back to competitions
            </a>
          </main>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl border-x border-border">
        <CompetitionHeader
          competition={data.competition}
          stats={{
            teamsCount: data.teamsCount,
            matchesCount: data.matchesCount,
            currentRound: data.currentRound,
          }}
        />
        <main className="space-y-4 p-4 sm:p-6">
          <CompetitionTabs competitionId={resolvedParams.id} />
        </main>
      </div>
    </AppLayout>
  )
}
