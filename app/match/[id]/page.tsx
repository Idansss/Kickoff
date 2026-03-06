import type { Metadata } from 'next'
import type { MatchDTO } from '@/lib/football/providers/types'
import { MatchHeader } from '@/components/football/match/MatchHeader'
import { MatchTimeline } from '@/components/football/match/MatchTimeline'
import { MatchLineups } from '@/components/football/match/MatchLineups'
import { MatchStats } from '@/components/football/match/MatchStats'
import { LiveAutoRefresh } from '@/components/football/match/LiveAutoRefresh'
import { PitchFormation } from '@/components/football/match/PitchFormation'
import { TacticalAI } from '@/components/football/match/TacticalAI'
import { LiveMatchChat } from '@/components/football/match/LiveMatchChat'
import { VideoHighlights } from '@/components/football/match/VideoHighlights'

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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const data = await fetchMatch(params.id)
    const m = data.match
    const score = m.status === 'FINISHED' || m.status === 'LIVE'
      ? ` ${m.homeTeam.score ?? 0}–${m.awayTeam.score ?? 0}` : ''
    const title = `${m.homeTeam.name} vs ${m.awayTeam.name}${score} - KICKOFF`
    const description = `${m.competition.name} · ${m.status === 'LIVE' ? '🔴 LIVE' : m.status}`
    return {
      title,
      description,
      openGraph: { title, description, siteName: 'KICKOFF' },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    return { title: 'Match - KICKOFF' }
  }
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

            {/* Formation visualizer */}
            {(current.lineups.home.startingXI.length > 0 || current.lineups.away.startingXI.length > 0) && (
              <PitchFormation
                lineups={current.lineups}
                homeTeamName={current.match.homeTeam.name}
                awayTeamName={current.match.awayTeam.name}
              />
            )}

            <MatchLineups
              lineups={current.lineups}
              homeTeamName={current.match.homeTeam.name}
              awayTeamName={current.match.awayTeam.name}
            />

            {/* AI Tactical Breakdown */}
            <TacticalAI
              homeTeam={current.match.homeTeam.name}
              awayTeam={current.match.awayTeam.name}
            />

            {/* Video Highlights */}
            <VideoHighlights
              homeTeam={current.match.homeTeam.name}
              awayTeam={current.match.awayTeam.name}
              matchId={match.id}
            />

            {/* Live Match Chat */}
            <LiveMatchChat matchId={match.id} />
          </>
        )}
      </LiveAutoRefresh>
    </main>
  )
}
