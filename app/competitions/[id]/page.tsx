import { AppLayout } from '@/components/app-layout'
import { CompetitionHeader } from '@/components/football/competition/CompetitionHeader'
import { CompetitionTabs } from '@/components/football/competition/CompetitionTabs'

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
  params: {
    id: string
  }
}

async function fetchOverview(id: string): Promise<CompetitionOverviewResponse> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/football/competitions/${id}/overview`, {
    next: { revalidate: 120 },
  })
  if (!res.ok) {
    throw new Error('Competition not found')
  }
  return (await res.json()) as CompetitionOverviewResponse
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const data = await fetchOverview(params.id)

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
          <CompetitionTabs competitionId={params.id} />
        </main>
      </div>
    </AppLayout>
  )
}

