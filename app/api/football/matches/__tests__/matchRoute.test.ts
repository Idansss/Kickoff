import { describe, expect, it, vi } from 'vitest'
import type { MatchDTO } from '@/lib/football/providers/types'
import { GET } from '@/app/api/football/matches/[id]/route'

vi.mock('@/lib/football/service', () => {
  const mockDto: MatchDTO = {
    match: {
      id: 'm1',
      kickoff: new Date().toISOString(),
      status: 'SCHEDULED',
      venue: 'Test Stadium',
      competition: { id: 'c1', name: 'Test League', logoUrl: null },
      homeTeam: { id: 't1', name: 'Home FC', badgeUrl: null, score: 1 },
      awayTeam: { id: 't2', name: 'Away FC', badgeUrl: null, score: 0 },
    },
    events: [
      {
        id: 'e1',
        minute: 10,
        type: 'goal',
        teamId: 't1',
        teamName: 'Home FC',
        player: { id: 'p1', name: 'Player One', photoUrl: null },
        assist: null,
      },
    ],
    lineups: {
      home: { startingXI: [], bench: [] },
      away: { startingXI: [], bench: [] },
    },
    stats: null,
  }

  return {
    footballService: {
      match: vi.fn().mockResolvedValue(mockDto),
    },
  }
})

describe('/api/football/matches/[id] route', () => {
  it('returns match, events and lineups keys', async () => {
    const res = await GET(new Request('http://localhost/api/football/matches/m1') as any, {
      params: Promise.resolve({ id: 'm1' }),
    } as any)

    expect(res.status).toBe(200)
    const json = (await res.json()) as MatchDTO

    expect(json.match).toBeDefined()
    expect(json.events).toBeDefined()
    expect(json.lineups).toBeDefined()
  })
})

