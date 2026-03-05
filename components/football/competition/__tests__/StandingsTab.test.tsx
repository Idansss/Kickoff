import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StandingsTab } from '@/components/football/competition/tabs/StandingsTab'

beforeEach(() => {
  vi.spyOn(global, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => ({
      rows: [
        {
          position: 1,
          team: { id: 't1', name: 'Manchester City', badgeUrl: null },
          played: 10,
          won: 8,
          drawn: 1,
          lost: 1,
          goalsFor: 25,
          goalsAgainst: 8,
          goalDiff: 17,
          points: 25,
          form: 'WWDWW',
        },
      ],
    }),
  } as Response)
})

describe('StandingsTab', () => {
  it('renders a table row with team name and points', async () => {
    render(<StandingsTab competitionId="c1" />)

    await waitFor(() => {
      expect(screen.getByText('Manchester City')).toBeInTheDocument()
    })

    const cells = screen.getAllByText('25')
    expect(cells.length).toBeGreaterThan(0)
  })
})

