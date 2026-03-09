import { GET } from '../route'

vi.mock('@/lib/db', () => {
  const players = [
    {
      id: 'p1',
      name: 'Young Forward',
      nationality: 'England',
      birthCountry: null,
      position: 'FW',
      preferredFoot: 'Left',
      heightCm: 180,
      dob: new Date(),
      currentTeam: { id: 't1', name: 'Test FC', badgeUrl: null },
      marketValues: [{ valueEur: 20_000_000, date: new Date(), currency: 'EUR' }],
      playerAgents: [],
      contracts: [],
    },
  ]

  return {
    db: {
      player: {
        findMany: vi.fn().mockResolvedValue(players),
        count: vi.fn().mockResolvedValue(players.length),
      },
    },
  }
})

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/search/players/advanced', () => {
  const base = 'http://localhost/api/search/players/advanced'

  it('returns paginated results with defaults', async () => {
    const res = await GET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: any[]; page: number; pageSize: number; total: number }
    expect(json.page).toBe(1)
    expect(Array.isArray(json.results)).toBe(true)
    expect(json.total).toBeGreaterThanOrEqual(0)
  })

  it('filters by nationality and position (shape only with mock)', async () => {
    const res = await GET(makeRequest(`${base}?nationality=England&position=FW`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: any[] }
    expect(Array.isArray(json.results)).toBe(true)
  })

  it('accepts age and value range filters without error', async () => {
    const res = await GET(makeRequest(`${base}?ageMin=18&ageMax=35&valueMin=10000000`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: any[] }
    expect(Array.isArray(json.results)).toBe(true)
  })
})


