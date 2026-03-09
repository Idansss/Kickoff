import { GET } from '../route'

vi.mock('@/lib/db', () => {
  const players = [
    {
      id: 'fa1',
      name: 'Free Agent One',
      nationality: 'England',
      position: 'FW',
      dob: new Date(),
      currentTeamId: null,
      marketValues: [{ valueEur: 10_000_000, date: new Date(), currency: 'EUR' }],
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

describe('GET /api/players/free-agents', () => {
  const base = 'http://localhost/api/players/free-agents'

  it('returns a list of free agents', async () => {
    const res = await GET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: any[]; page: number; total: number }
    expect(json.page).toBe(1)
    expect(Array.isArray(json.results)).toBe(true)
  })

  it('accepts filter query params without error', async () => {
    const res = await GET(makeRequest(`${base}?nationality=England&position=FW&valueMin=5000000`))
    expect(res.ok).toBe(true)
  })
})

