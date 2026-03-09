import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MatchTimeline } from '@/components/football/match/MatchTimeline'
import type { MatchEventDTO } from '@/lib/football/providers/types'

const baseEvents: MatchEventDTO[] = [
  {
    id: 'e1',
    minute: 15,
    type: 'goal',
    teamId: 'home-team',
    teamName: 'Home FC',
    player: { id: 'p1', name: 'Striker One' },
    assist: null,
  },
  {
    id: 'e2',
    minute: 35,
    type: 'yellow',
    teamId: 'away-team',
    teamName: 'Away FC',
    player: { id: 'p2', name: 'Defender Two' },
    assist: null,
  },
]

describe('Football MatchTimeline', () => {
  it('renders goal and card events with minutes and player names', () => {
    render(
      <MatchTimeline
        events={baseEvents}
        homeTeam={{ id: 'home-team', name: 'Home FC', badgeUrl: null }}
        awayTeam={{ id: 'away-team', name: 'Away FC', badgeUrl: null }}
      />,
    )

    expect(screen.getByText("15'")).toBeInTheDocument()
    expect(screen.getByText('Striker One')).toBeInTheDocument()
    expect(screen.getByText("35'")).toBeInTheDocument()
    expect(screen.getByText('Defender Two')).toBeInTheDocument()
  })
})
