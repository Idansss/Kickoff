import type { MatchDTO } from '@/lib/football/providers/types'
import { MatchHeader } from '@/components/football/match/MatchHeader'
import { MatchTimeline } from '@/components/football/match/MatchTimeline'
import { MatchLineups } from '@/components/football/match/MatchLineups'
import { MatchStats } from '@/components/football/match/MatchStats'
import { MatchVisualPlaceholders } from '@/components/football/match/MatchVisualPlaceholders'
import { LiveAutoRefresh } from '@/components/football/match/LiveAutoRefresh'

async function fetchMatch(id: string): Promise<MatchDTO> {
  const base =
    process.env.VERCEL_URL != null
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(`${base}/api/football/matches/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Match not found')
  }

  const json = (await res.json()) as MatchDTO
  return json
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const data = await fetchMatch(params.id)
  const { match } = data

  const isLive = match.status === 'LIVE'

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <LiveAutoRefresh matchId={match.id} initial={data} isLive={isLive}>
        {(current) => (
          <>
            <MatchHeader match={current.match} />

            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
              <MatchTimeline
                events={current.events}
                homeTeamName={current.match.homeTeam.name}
                awayTeamName={current.match.awayTeam.name}
              />
              <MatchStats
                stats={current.stats}
                homeTeamName={current.match.homeTeam.name}
                awayTeamName={current.match.awayTeam.name}
              />
            </div>

            <MatchLineups
              lineups={current.lineups}
              homeTeamName={current.match.homeTeam.name}
              awayTeamName={current.match.awayTeam.name}
            />

            <MatchVisualPlaceholders />
          </>
        )}
      </LiveAutoRefresh>
    </main>
  )
}
