import { GET as topPlayersGET } from '../top-players/route'
import { GET as topClubsGET } from '../top-clubs/route'
import { GET as moversGET } from '../movers/route'
import { GET as playerHistoryGET } from '../player-history/[id]/route'
import { GET as clubHistoryGET } from '../club-history/[id]/route'

const now = new Date()
const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

vi.mock('@/lib/db', () => {
  const PLAYERS = [
    {
      id: 'p1',
      name: 'Erling Haaland',
      nationality: 'Norwegian',
      position: 'FW',
      dob: new Date('1999-01-01'),
      currentTeam: { id: 't1', name: 'City FC', badgeUrl: null, country: 'England' },
      marketValues: [
        { valueEur: 180_000_000, date: new Date(), currency: 'EUR' },
        { valueEur: 170_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR' },
      ],
    },
    {
      id: 'p2',
      name: 'Bukayo Saka',
      nationality: 'English',
      position: 'FW',
      dob: new Date('2001-09-05'),
      currentTeam: { id: 't2', name: 'Arsenal', badgeUrl: null, country: 'England' },
      marketValues: [
        { valueEur: 140_000_000, date: new Date(), currency: 'EUR' },
        { valueEur: 150_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR' },
      ],
    },
    {
      id: 'p3',
      name: 'No Value Player',
      nationality: 'French',
      position: 'MF',
      dob: null,
      currentTeam: null,
      marketValues: [],
    },
  ]

  const TEAMS = [
    {
      id: 't1',
      name: 'City FC',
      badgeUrl: null,
      country: 'England',
      marketValues: [
        { valueEur: 900_000_000, date: new Date(), currency: 'EUR' },
        { valueEur: 850_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR' },
      ],
    },
    {
      id: 't2',
      name: 'Arsenal',
      badgeUrl: null,
      country: 'England',
      marketValues: [
        { valueEur: 700_000_000, date: new Date(), currency: 'EUR' },
        { valueEur: 720_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR' },
      ],
    },
    {
      id: 't3',
      name: 'No Value Club',
      badgeUrl: null,
      country: 'Spain',
      marketValues: [],
    },
  ]

  const SNAPSHOTS_PLAYER = [
    { valueEur: 160_000_000, date: new Date(Date.now() - 60 * 86400000), currency: 'EUR', source: 'Seed' },
    { valueEur: 170_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR', source: 'Seed' },
    { valueEur: 180_000_000, date: new Date(), currency: 'EUR', source: 'Seed' },
  ]

  const SNAPSHOTS_CLUB = [
    { valueEur: 800_000_000, date: new Date(Date.now() - 60 * 86400000), currency: 'EUR', source: 'Seed' },
    { valueEur: 850_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR', source: 'Seed' },
    { valueEur: 900_000_000, date: new Date(), currency: 'EUR', source: 'Seed' },
  ]

  return {
    db: {
      player: {
        findMany: vi.fn().mockResolvedValue(PLAYERS),
        findUnique: vi.fn().mockResolvedValue({ id: 'p1', name: 'Erling Haaland' }),
      },
      team: {
        findMany: vi.fn().mockResolvedValue(TEAMS),
        findUnique: vi.fn().mockResolvedValue({ id: 't1', name: 'City FC' }),
      },
      marketValueSnapshot: {
        findMany: vi.fn().mockResolvedValue(SNAPSHOTS_PLAYER),
      },
    },
  }
})

function makeRequest(url: string) {
  return new Request(url)
}

// -----------------------------------------------------------------------
// Top Players
// -----------------------------------------------------------------------
describe('GET /api/market-values/top-players', () => {
  const base = 'http://localhost/api/market-values/top-players'

  it('returns ranked players sorted by value descending', async () => {
    const res = await topPlayersGET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      results: Array<{ rank: number; id: string; latestValueFormatted: string; deltaDirection: string | null }>
      total: number
    }
    expect(json.total).toBe(2) // p3 has no market value, excluded
    expect(json.results[0]?.id).toBe('p1')
    expect(json.results[0]?.rank).toBe(1)
    expect(json.results[0]?.latestValueFormatted).toBe('€180.0m')
    expect(json.results[0]?.deltaDirection).toBe('up') // 180 > 170
    expect(json.results[1]?.deltaDirection).toBe('down') // 140 < 150
  })

  it('accepts position filter', async () => {
    const res = await topPlayersGET(makeRequest(`${base}?position=FW`))
    expect(res.ok).toBe(true)
  })

  it('accepts nationality filter', async () => {
    const res = await topPlayersGET(makeRequest(`${base}?nationality=English`))
    expect(res.ok).toBe(true)
  })

  it('filters by valueMin', async () => {
    const res = await topPlayersGET(makeRequest(`${base}?valueMin=150000000`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ id: string }> }
    expect(json.results.every((p) => p.id === 'p1')).toBe(true)
  })

  it('returns 400 on invalid page param', async () => {
    const res = await topPlayersGET(makeRequest(`${base}?page=0`))
    expect(res.status).toBe(400)
  })

  it('paginates correctly', async () => {
    const res = await topPlayersGET(makeRequest(`${base}?page=1&pageSize=1`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: unknown[]; totalPages: number }
    expect(json.results.length).toBe(1)
    expect(json.totalPages).toBe(2)
  })
})

// -----------------------------------------------------------------------
// Top Clubs
// -----------------------------------------------------------------------
describe('GET /api/market-values/top-clubs', () => {
  const base = 'http://localhost/api/market-values/top-clubs'

  it('returns ranked clubs sorted by value descending', async () => {
    const res = await topClubsGET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      results: Array<{ rank: number; id: string; latestValueFormatted: string; deltaDirection: string | null }>
      total: number
    }
    expect(json.total).toBe(2) // t3 excluded (no snapshots)
    expect(json.results[0]?.id).toBe('t1')
    expect(json.results[0]?.rank).toBe(1)
    expect(json.results[0]?.latestValueFormatted).toBe('€900.0m')
    expect(json.results[0]?.deltaDirection).toBe('up')
    expect(json.results[1]?.deltaDirection).toBe('down') // Arsenal dropped
  })

  it('accepts country filter without error', async () => {
    const res = await topClubsGET(makeRequest(`${base}?country=England`))
    expect(res.ok).toBe(true)
  })
})

// -----------------------------------------------------------------------
// Movers
// -----------------------------------------------------------------------
describe('GET /api/market-values/movers', () => {
  const base = 'http://localhost/api/market-values/movers'

  it('returns gainers and losers lists', async () => {
    const res = await moversGET(makeRequest(base))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      gainers: Array<{ name: string; deltaDirection: string }>
      losers: Array<{ name: string; deltaDirection: string }>
    }
    expect(Array.isArray(json.gainers)).toBe(true)
    expect(Array.isArray(json.losers)).toBe(true)
    expect(json.gainers.every((g) => g.deltaDirection === 'up')).toBe(true)
    expect(json.losers.every((l) => l.deltaDirection === 'down')).toBe(true)
  })

  it('scopes to players only', async () => {
    const res = await moversGET(makeRequest(`${base}?scope=players`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { gainers: Array<{ type: string }> }
    expect(json.gainers.every((g) => g.type === 'player')).toBe(true)
  })

  it('scopes to clubs only', async () => {
    const res = await moversGET(makeRequest(`${base}?scope=clubs`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { gainers: Array<{ type: string }> }
    expect(json.gainers.every((g) => g.type === 'club')).toBe(true)
  })

  it('returns 400 for invalid scope', async () => {
    const res = await moversGET(makeRequest(`${base}?scope=bad`))
    expect(res.status).toBe(400)
  })
})

// -----------------------------------------------------------------------
// Player history
// -----------------------------------------------------------------------
describe('GET /api/market-values/player-history/[id]', () => {
  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns history array and summary', async () => {
    const res = await playerHistoryGET(makeRequest('http://localhost/'), makeCtx('p1'))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      playerId: string
      history: Array<{ valueEur: number; formatted: string }>
      summary: { latest: { value: string } | null; allTimeHigh: { value: string } | null }
    }
    expect(json.playerId).toBe('p1')
    expect(json.history.length).toBe(3)
    expect(json.summary.latest?.value).toBe('€180.0m')
    expect(json.summary.allTimeHigh?.value).toBe('€180.0m')
  })

  it('returns 404 for unknown player', async () => {
    const { db } = await import('@/lib/db')
    ;(db.player.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await playerHistoryGET(makeRequest('http://localhost/'), makeCtx('unknown'))
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty id', async () => {
    const res = await playerHistoryGET(makeRequest('http://localhost/'), makeCtx(''))
    expect(res.status).toBe(400)
  })
})

// -----------------------------------------------------------------------
// Club history
// -----------------------------------------------------------------------
describe('GET /api/market-values/club-history/[id]', () => {
  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns history and summary for a club', async () => {
    const { db } = await import('@/lib/db')
    ;(db.marketValueSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { valueEur: 800_000_000, date: new Date(Date.now() - 60 * 86400000), currency: 'EUR', source: 'Seed' },
      { valueEur: 850_000_000, date: new Date(Date.now() - 30 * 86400000), currency: 'EUR', source: 'Seed' },
      { valueEur: 900_000_000, date: new Date(), currency: 'EUR', source: 'Seed' },
    ])
    const res = await clubHistoryGET(makeRequest('http://localhost/'), makeCtx('t1'))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      teamId: string
      history: Array<{ valueEur: number }>
      summary: { latest: { value: string } | null }
    }
    expect(json.teamId).toBe('t1')
    expect(json.history.length).toBe(3)
    expect(json.summary.latest?.value).toBe('€900m')
  })

  it('returns 404 for unknown club', async () => {
    const { db } = await import('@/lib/db')
    ;(db.team.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await clubHistoryGET(makeRequest('http://localhost/'), makeCtx('nope'))
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty id', async () => {
    const res = await clubHistoryGET(makeRequest('http://localhost/'), makeCtx(''))
    expect(res.status).toBe(400)
  })
})
