import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PlayerMatchLog } from '@/components/football/player/PlayerMatchLog'

beforeEach(() => {
  vi.spyOn(global, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => ({
      matches: [
        {
          matchId: 'm1',
          date: new Date('2026-03-05T20:00:00.000Z').toISOString(),
          competition: { id: 'c1', name: 'Premier League' },
          opponent: { id: 't2', name: 'Arsenal', badgeUrl: null },
          teamId: 't1',
          isHome: true,
          minutes: { inMin: 0, outMin: 90, playedMinutes: 90 },
          contributions: { goals: 1, assists: 0 },
          cards: { yellow: 1, red: 0 },
          rating: 7.8,
          result: 'W 3-1',
        },
      ],
    }),
  } as Response)
})

describe('PlayerMatchLog', () => {
  it('renders opponent name and rating', async () => {
    render(<PlayerMatchLog playerId="p1" />)

    expect(await screen.findByText(/arsenal/i)).toBeInTheDocument()
    expect(await screen.findByText(/rating 7\.8/i)).toBeInTheDocument()
  })
})

