import { GET as listGET } from '../route'
import { GET as detailGET } from '../[id]/route'

// vi.mock is hoisted — define all data inside the factory to avoid TDZ errors
vi.mock('@/lib/db', () => {
  const mockNow = new Date()

  const AGENTS = [
    {
      id: 'agent1',
      name: 'Mino Rossi',
      country: 'Italy',
      email: 'mino@example.com',
      phone: null,
      agencyMemberships: [
        {
          agency: { id: 'agency1', name: 'Elite Football Agency', country: 'Italy' },
          role: 'Founder',
        },
      ],
      playerAgents: [
        {
          endDate: null,
          player: {
            id: 'p1',
            name: 'Test Player',
            nationality: 'Italian',
            position: 'FW',
            dob: new Date('1997-06-01'),
            photoUrl: null,
            currentTeam: { id: 't1', name: 'City FC', badgeUrl: null },
            marketValues: [{ valueEur: 80_000_000, date: mockNow, currency: 'EUR' }],
            contracts: [{ status: 'ACTIVE', endDate: new Date('2026-06-30') }],
          },
        },
      ],
    },
    {
      id: 'agent2',
      name: 'Sarah Klein',
      country: 'Germany',
      email: 'sarah@example.com',
      phone: null,
      agencyMemberships: [],
      playerAgents: [],
    },
  ]

  const AGENT_DETAIL = {
    id: 'agent1',
    name: 'Mino Rossi',
    country: 'Italy',
    email: 'mino@example.com',
    phone: null,
    agencyMemberships: [
      {
        agency: {
          id: 'agency1',
          name: 'Elite Football Agency',
          country: 'Italy',
          website: 'https://elite.example.com',
        },
        role: 'Founder',
        startDate: null,
      },
    ],
    contracts: [],
    playerAgents: [
      {
        endDate: null,
        startDate: new Date('2022-01-01'),
        player: {
          id: 'p1',
          name: 'Test Player',
          nationality: 'Italian',
          position: 'FW',
          dob: new Date('1997-06-01'),
          photoUrl: null,
          currentTeam: { id: 't1', name: 'City FC', badgeUrl: null },
          marketValues: [{ valueEur: 80_000_000, date: mockNow, currency: 'EUR' }],
          contracts: [{ status: 'ACTIVE', endDate: new Date('2026-06-30') }],
        },
        agency: { id: 'agency1', name: 'Elite Football Agency' },
      },
    ],
  }

  return {
    db: {
      agent: {
        findMany: vi.fn().mockResolvedValue(AGENTS),
        count: vi.fn().mockResolvedValue(AGENTS.length),
        findUnique: vi.fn().mockResolvedValue(AGENT_DETAIL),
      },
    },
  }
})

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/agents', () => {
  const base = 'http://localhost/api/agents'

  it('returns paginated agent list with computed stats', async () => {
    const res = await listGET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      results: Array<{ id: string; name: string; clientCount: number; totalClientValueFormatted: string | null }>
      total: number
      page: number
      totalPages: number
    }
    expect(json.page).toBe(1)
    expect(Array.isArray(json.results)).toBe(true)
    expect(json.total).toBe(2)
    const agent1 = json.results.find((a) => a.id === 'agent1')
    expect(agent1).toBeDefined()
    expect(agent1!.clientCount).toBe(1)
    expect(agent1!.totalClientValueFormatted).toBe('€80.0m')
  })

  it('accepts search and country filter params', async () => {
    const res = await listGET(makeRequest(`${base}?search=Mino&country=Italy`))
    expect(res.ok).toBe(true)
  })

  it('sorts by value_desc', async () => {
    const res = await listGET(makeRequest(`${base}?sort=value_desc`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ id: string }> }
    // agent1 has the higher value and should appear first
    expect(json.results[0]?.id).toBe('agent1')
  })

  it('sorts by name_asc', async () => {
    const res = await listGET(makeRequest(`${base}?sort=name_asc`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ name: string }> }
    expect(json.results[0]?.name).toBe('Mino Rossi')
  })

  it('returns 400 on invalid sort param', async () => {
    const res = await listGET(makeRequest(`${base}?sort=bad_value`))
    expect(res.status).toBe(400)
  })

  it('paginates: page=2 pageSize=1 returns 2nd agent', async () => {
    const res = await listGET(makeRequest(`${base}?page=2&pageSize=1`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { page: number; results: unknown[] }
    expect(json.page).toBe(2)
    expect(json.results.length).toBe(1)
  })
})

describe('GET /api/agents/[id]', () => {
  const makeContext = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns full agent detail with currentClients and stats', async () => {
    const res = await detailGET(
      makeRequest('http://localhost/api/agents/agent1'),
      makeContext('agent1'),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      agent: { id: string; name: string }
      stats: { currentClientCount: number; totalClientValueFormatted: string | null }
      currentClients: unknown[]
      pastClients: unknown[]
    }
    expect(json.agent.id).toBe('agent1')
    expect(json.agent.name).toBe('Mino Rossi')
    expect(json.stats.currentClientCount).toBe(1)
    expect(json.stats.totalClientValueFormatted).toBe('€80.0m')
    expect(Array.isArray(json.currentClients)).toBe(true)
    expect(Array.isArray(json.pastClients)).toBe(true)
  })

  it('returns 404 when agent not found', async () => {
    const { db } = await import('@/lib/db')
    ;(db.agent.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await detailGET(
      makeRequest('http://localhost/api/agents/nope'),
      makeContext('nope'),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty id', async () => {
    const res = await detailGET(makeRequest('http://localhost/api/agents/'), makeContext(''))
    expect(res.status).toBe(400)
  })
})
