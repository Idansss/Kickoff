import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/football/teams/[id]/stats/route'

vi.mock('@/lib/db', () => {
  return {
    db: {
      match: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'm1',
            status: 'FINISHED',
            homeTeamId: 't1',
            awayTeamId: 't2',
            homeScore: 2,
            awayScore: 1,
            statsJson: null,
            events: [
              { id: 'e1', teamId: 't1', type: 'yellow' },
              { id: 'e2', teamId: 't1', type: 'red' },
            ],
          },
        ]),
      },
    },
  }
})

describe('/api/football/teams/[id]/stats route', () => {
  it('returns totals, perMatch and matchesPlayed', async () => {
    const res = await GET(new Request('http://localhost/api/football/teams/t1/stats') as any, {
      params: Promise.resolve({ id: 't1' }),
    } as any)

    expect(res.status).toBe(200)
    const json = (await res.json()) as any

    expect(json.matchesPlayed).toBe(1)
    expect(json.totals).toBeDefined()
    expect(json.perMatch).toBeDefined()
    expect(json.totals.points).toBe(3)
  })
})

