import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MatchCard } from '@/components/matches/MatchCard'
import type { Match } from '@/types'

const baseMatch: Match = {
  id: 'm-1',
  competition: 'Premier League',
  competitionFlag: '🏴',
  home: { name: 'Manchester City', score: 2, color: '#6CABDD' },
  away: { name: 'Arsenal', score: 1, color: '#EF0107' },
  minute: 67,
  status: 'live',
  xG: { home: 1.5, away: 0.7 },
  events: [],
  momentum: [],
  shots: [],
}

describe('MatchCard', () => {
  it('renders home and away team names', () => {
    render(<MatchCard match={baseMatch} />)
    expect(screen.getByText('Manchester City')).toBeInTheDocument()
    expect(screen.getByText('Arsenal')).toBeInTheDocument()
  })

  it('renders correct score', () => {
    render(<MatchCard match={baseMatch} />)
    expect(screen.getByText('2 - 1')).toBeInTheDocument()
  })

  it('renders live minute with pulsing indicator when live', () => {
    render(<MatchCard match={baseMatch} />)
    expect(screen.getByRole('status', { name: /live match in progress/i })).toBeInTheDocument()
    expect(screen.getByText("67'")).toBeInTheDocument()
  })

  it('renders kickoff time when status is upcoming', () => {
    const kickoffTime = new Date('2026-03-05T19:30:00.000Z')
    const upcoming: Match = {
      ...baseMatch,
      status: 'upcoming',
      minute: 0,
      kickoffTime: kickoffTime.toISOString(),
    }

    render(<MatchCard match={upcoming} />)
    const expected = kickoffTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
