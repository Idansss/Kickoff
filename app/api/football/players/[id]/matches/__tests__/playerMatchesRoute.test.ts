import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/football/players/[id]/matches/route'

vi.mock('@/lib/db', () => {
  return {
    db: {
      matchLineup: {
        findMany: vi.fn().mockResolvedValue([
          {
            matchId: 'm1',
            teamId: 't1',
            playerId: 'p1',
            isStarting: true,
            inMin: 0,
            outMin: 90,
            rating: 7.5,
            g_aJson: { goals: 2, assists: 1 },
            cardsJson: { yellow: 1, red: 0 },
            match: {
              id: 'm1',
              kickoff: new Date('2026-03-05T20:00:00.000Z'),
              status: 'FINISHED',
              competitionId: 'c1',
              competition: { id: 'c1', name: 'Premier League' },
              homeTeamId: 't1',
              awayTeamId: 't2',
              homeScore: 3,
              awayScore: 1,
              homeTeam: { id: 't1', name: 'Home FC', badgeUrl: null },
              awayTeam: { id: 't2', name: 'Away FC', badgeUrl: null },
              events: [],
            },
          },
        ]),
      },
    },
  }
})

describe('/api/football/players/[id]/matches route', () => {
  it('returns match log rows with required keys', async () => {
    const res = await GET(new Request('http://localhost/api/football/players/p1/matches'), {
      params: { id: 'p1' },
    })

    expect(res.status).toBe(200)
    const json = (await res.json()) as any

    expect(Array.isArray(json.matches)).toBe(true)
    expect(json.matches.length).toBeGreaterThan(0)

    const row = json.matches[0]
    expect(row).toHaveProperty('matchId')
    expect(row).toHaveProperty('date')
    expect(row).toHaveProperty('competition')
    expect(row).toHaveProperty('opponent')
    expect(row).toHaveProperty('minutes')
    expect(row).toHaveProperty('contributions')
    expect(row).toHaveProperty('cards')
    expect(row).toHaveProperty('rating')
  })
})

