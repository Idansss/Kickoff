import { GET as listGET } from '../route'
import { GET as detailGET } from '../[id]/route'

vi.mock('@/lib/db', () => {
  const mockNow = new Date()

  const AGENCIES = [
    {
      id: 'agency1',
      name: 'Elite Football Agency',
      country: 'Italy',
      website: 'https://elite.example.com',
      agents: [
        { agent: { id: 'agent1', name: 'Mino Rossi', country: 'Italy' }, role: 'Founder' },
        { agent: { id: 'agent2', name: 'Sarah Klein', country: 'Germany' }, role: 'Senior Agent' },
      ],
      playerAgents: [
        {
          endDate: null,
          player: {
            id: 'p1',
            name: 'Test Player',
            nationality: 'Italian',
            position: 'FW',
            currentTeam: { id: 't1', name: 'City FC', badgeUrl: null },
            marketValues: [{ valueEur: 80_000_000, date: mockNow, currency: 'EUR' }],
          },
        },
        {
          endDate: null,
          player: {
            id: 'p2',
            name: 'Second Player',
            nationality: 'German',
            position: 'MF',
            currentTeam: { id: 't2', name: 'United FC', badgeUrl: null },
            marketValues: [{ valueEur: 50_000_000, date: mockNow, currency: 'EUR' }],
          },
        },
      ],
    },
    {
      id: 'agency2',
      name: 'Global Sports Management',
      country: 'Spain',
      website: null,
      agents: [{ agent: { id: 'agent3', name: 'Luis Romero', country: 'Spain' }, role: 'Lead Agent' }],
      playerAgents: [],
    },
  ]

  const AGENCY_DETAIL = {
    id: 'agency1',
    name: 'Elite Football Agency',
    country: 'Italy',
    website: 'https://elite.example.com',
    agents: [
      {
        agent: {
          id: 'agent1',
          name: 'Mino Rossi',
          country: 'Italy',
          email: 'mino@example.com',
          playerAgents: [{ id: 'pa1' }, { id: 'pa2' }],
        },
        role: 'Founder',
        startDate: null,
      },
    ],
    playerAgents: [
      {
        endDate: null,
        startDate: new Date('2022-06-01'),
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
        agent: { id: 'agent1', name: 'Mino Rossi' },
      },
    ],
  }

  return {
    db: {
      agency: {
        findMany: vi.fn().mockResolvedValue(AGENCIES),
        count: vi.fn().mockResolvedValue(AGENCIES.length),
        findUnique: vi.fn().mockResolvedValue(AGENCY_DETAIL),
      },
    },
  }
})

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/agencies', () => {
  const base = 'http://localhost/api/agencies'

  it('returns paginated agency list with computed stats', async () => {
    const res = await listGET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      results: Array<{
        id: string
        name: string
        agentCount: number
        clientCount: number
        totalClientValueFormatted: string | null
      }>
      total: number
      page: number
      totalPages: number
    }
    expect(json.page).toBe(1)
    expect(json.total).toBe(2)
    const agency1 = json.results.find((a) => a.id === 'agency1')
    expect(agency1).toBeDefined()
    expect(agency1!.agentCount).toBe(2)
    expect(agency1!.clientCount).toBe(2)
    expect(agency1!.totalClientValueFormatted).toBe('€130.0m')
  })

  it('accepts search and country filters', async () => {
    const res = await listGET(makeRequest(`${base}?search=Elite&country=Italy`))
    expect(res.ok).toBe(true)
  })

  it('sorts by clients_desc', async () => {
    const res = await listGET(makeRequest(`${base}?sort=clients_desc`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ id: string }> }
    expect(json.results[0]?.id).toBe('agency1')
  })

  it('sorts by agents_desc', async () => {
    const res = await listGET(makeRequest(`${base}?sort=agents_desc`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ id: string }> }
    expect(json.results[0]?.id).toBe('agency1')
  })

  it('sorts by name_asc', async () => {
    const res = await listGET(makeRequest(`${base}?sort=name_asc`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ name: string }> }
    expect(json.results[0]?.name).toBe('Elite Football Agency')
  })

  it('returns 400 on invalid sort param', async () => {
    const res = await listGET(makeRequest(`${base}?sort=invalid`))
    expect(res.status).toBe(400)
  })

  it('paginates: page=2 pageSize=1 returns second agency', async () => {
    const res = await listGET(makeRequest(`${base}?page=2&pageSize=1`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { page: number; results: unknown[] }
    expect(json.page).toBe(2)
    expect(json.results.length).toBe(1)
  })
})

describe('GET /api/agencies/[id]', () => {
  const makeContext = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns agency detail with agents, stats, and currentClients', async () => {
    const res = await detailGET(
      makeRequest('http://localhost/api/agencies/agency1'),
      makeContext('agency1'),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      agency: { id: string; name: string }
      agents: Array<{ id: string; activeClientCount: number }>
      stats: {
        agentCount: number
        currentClientCount: number
        totalClientValueFormatted: string | null
      }
      currentClients: Array<{ id: string; marketValue: { formatted: string } | null }>
    }
    expect(json.agency.id).toBe('agency1')
    expect(json.agency.name).toBe('Elite Football Agency')
    expect(json.stats.agentCount).toBe(1)
    expect(json.stats.currentClientCount).toBe(1)
    expect(json.stats.totalClientValueFormatted).toBe('€80.0m')
    expect(json.agents[0]?.activeClientCount).toBe(2)
    expect(json.currentClients[0]?.marketValue?.formatted).toBe('€80.0m')
  })

  it('returns 404 when agency not found', async () => {
    const { db } = await import('@/lib/db')
    ;(db.agency.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await detailGET(
      makeRequest('http://localhost/api/agencies/nope'),
      makeContext('nope'),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty id', async () => {
    const res = await detailGET(
      makeRequest('http://localhost/api/agencies/'),
      makeContext(''),
    )
    expect(res.status).toBe(400)
  })
})
