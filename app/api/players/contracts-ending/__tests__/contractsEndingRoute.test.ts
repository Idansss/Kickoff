import { GET } from '../route'

vi.mock('@/lib/db', () => {
  const contracts = [
    {
      id: 'c1',
      playerId: 'p1',
      clubId: 't1',
      startDate: new Date(),
      endDate: new Date(),
      isOnLoan: false,
      loanFromTeamId: null,
      status: 'ACTIVE',
      wageEur: 100_000,
      releaseClauseEur: null,
      extensionOptionDate: null,
      agentId: null,
      player: {
        id: 'p1',
        name: 'Contract Player',
        nationality: 'England',
        position: 'MF',
        dob: new Date(),
        currentTeam: { id: 't1', name: 'Test FC', badgeUrl: null },
        marketValues: [{ valueEur: 30_000_000, date: new Date(), currency: 'EUR' }],
        squads: [],
        playerAgents: [],
      },
      club: {
        id: 't1',
        name: 'Test FC',
        badgeUrl: null,
      },
    },
  ]

  return {
    db: {
      playerContract: {
        findMany: vi.fn().mockResolvedValue(contracts),
        count: vi.fn().mockResolvedValue(contracts.length),
      },
    },
  }
})

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/players/contracts-ending', () => {
  const base = 'http://localhost/api/players/contracts-ending'

  it('returns contracts ending in a window', async () => {
    const res = await GET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: any[]; page: number; total: number }
    expect(json.page).toBe(1)
    expect(Array.isArray(json.results)).toBe(true)
  })

  it('accepts filters without error', async () => {
    const res = await GET(makeRequest(`${base}?clubId=t1&position=MF`))
    expect(res.ok).toBe(true)
  })
})

