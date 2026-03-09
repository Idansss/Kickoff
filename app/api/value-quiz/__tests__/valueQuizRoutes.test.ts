import { GET as randomGET } from '../random/route'
import { POST as attemptPOST } from '../attempt/route'
import { GET as leaderboardGET } from '../leaderboard/route'
import { GET as historyGET } from '../history/route'
import type { NextRequest } from 'next/server'

// vi.mock hoisted — all data inside factory
vi.mock('@/lib/db', () => {
  const PLAYERS_WITH_VALUES = [
    {
      id: 'p1',
      name: 'Erling Haaland',
      position: 'FW',
      nationality: 'Norwegian',
      dob: new Date('1999-01-21'),
      photoUrl: null,
      currentTeam: { id: 't1', name: 'City FC', badgeUrl: null },
      marketValues: [{ valueEur: 180_000_000, date: new Date() }],
    },
    {
      id: 'p2',
      name: 'Bukayo Saka',
      position: 'FW',
      nationality: 'English',
      dob: new Date('2001-09-05'),
      photoUrl: null,
      currentTeam: { id: 't2', name: 'Arsenal', badgeUrl: null },
      marketValues: [{ valueEur: 140_000_000, date: new Date() }],
    },
  ]

  const PLAYER_WITH_VALUE = {
    id: 'p1',
    name: 'Erling Haaland',
    marketValues: [{ valueEur: 180_000_000, date: new Date() }],
  }

  const ATTEMPTS = [
    {
      id: 'att1',
      userId: 'u1',
      playerId: 'p1',
      guessedValueEur: 170_000_000,
      actualValueEur: 180_000_000,
      deltaEur: -10_000_000,
      createdAt: new Date(),
      user: { id: 'u1', name: 'Alice', handle: 'alice', avatar: '/alice.png' },
      player: { id: 'p1', name: 'Erling Haaland', position: 'FW', photoUrl: null, currentTeam: null },
    },
    {
      id: 'att2',
      userId: 'u2',
      playerId: 'p2',
      guessedValueEur: 100_000_000,
      actualValueEur: 140_000_000,
      deltaEur: -40_000_000,
      createdAt: new Date(),
      user: { id: 'u2', name: 'Bob', handle: 'bob', avatar: '/bob.png' },
      player: { id: 'p2', name: 'Bukayo Saka', position: 'FW', photoUrl: null, currentTeam: null },
    },
  ]

  return {
    db: {
      player: {
        findMany: vi.fn().mockResolvedValue(PLAYERS_WITH_VALUES),
        findUnique: vi.fn().mockResolvedValue(PLAYER_WITH_VALUE),
      },
      valueQuizAttempt: {
        create: vi.fn().mockResolvedValue({ id: 'att_new' }),
        findMany: vi.fn().mockResolvedValue(ATTEMPTS),
      },
    },
  }
})

vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn().mockResolvedValue('u1'),
}))

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as unknown as NextRequest
}

// -----------------------------------------------------------------------
// Random player
// -----------------------------------------------------------------------
describe('GET /api/value-quiz/random', () => {
  it('returns a player without exposing actual value', async () => {
    const res = await randomGET()
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      player: { id: string; name: string }
      valueBand: string
    }
    // player returned, actual value NOT in response
    expect(json.player.id).toBeDefined()
    expect(json.player.name).toBeDefined()
    expect((json as Record<string, unknown>).actualValueEur).toBeUndefined()
    expect((json.player as Record<string, unknown>).actualValueEur).toBeUndefined()
    expect(json.valueBand).toBeDefined()
  })

  it('returns 404 when no players with values exist', async () => {
    const { db } = await import('@/lib/db')
    ;(db.player.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])
    const res = await randomGET()
    expect(res.status).toBe(404)
  })

  it('returns age derived from dob', async () => {
    const res = await randomGET()
    const json = (await res.json()) as { player: { age: number | null } }
    expect(typeof json.player.age).toBe('number')
  })

  it('returns correct valueBand for high-value player', async () => {
    const res = await randomGET()
    const json = (await res.json()) as { valueBand: string }
    // Haaland at 180m → '€100m+' band
    expect(json.valueBand).toBe('€100m+')
  })
})

// -----------------------------------------------------------------------
// Attempt
// -----------------------------------------------------------------------
describe('POST /api/value-quiz/attempt', () => {
  const base = 'http://localhost/api/value-quiz/attempt'

  it('returns score, formatted values, and delta for a close guess', async () => {
    const res = await attemptPOST(
      makeRequest(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'p1', guessedValueEur: 175_000_000 }),
      }),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      score: number
      scoreLabel: string
      actualValueEur: number
      guessedFormatted: string
      actualFormatted: string
      deltaDirection: string
      percentageOff: number
    }
    expect(json.actualValueEur).toBe(180_000_000)
    // 175m vs 180m: |delta| = 5m, pct = 5/180 = 2.78% ≤ 5% → 100 pts
    expect(json.score).toBe(100)
    expect(json.guessedFormatted).toBe('€175.0m')
    expect(json.actualFormatted).toBe('€180.0m')
    expect(json.deltaDirection).toBe('under')
    expect(typeof json.percentageOff).toBe('number')
  })

  it('returns 0 score for a wildly wrong guess', async () => {
    const res = await attemptPOST(
      makeRequest(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'p1', guessedValueEur: 10_000_000 }),
      }),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { score: number }
    expect(json.score).toBe(0)
  })

  it('returns 400 for missing playerId', async () => {
    const res = await attemptPOST(
      makeRequest(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guessedValueEur: 50_000_000 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-positive guess', async () => {
    const res = await attemptPOST(
      makeRequest(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'p1', guessedValueEur: 0 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown player', async () => {
    const { db } = await import('@/lib/db')
    ;(db.player.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await attemptPOST(
      makeRequest(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'nope', guessedValueEur: 50_000_000 }),
      }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 422 when player has no market values', async () => {
    const { db } = await import('@/lib/db')
    ;(db.player.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'p3',
      name: 'No Value',
      marketValues: [],
    })
    const res = await attemptPOST(
      makeRequest(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'p3', guessedValueEur: 5_000_000 }),
      }),
    )
    expect(res.status).toBe(422)
  })
})

// -----------------------------------------------------------------------
// Leaderboard
// -----------------------------------------------------------------------
describe('GET /api/value-quiz/leaderboard', () => {
  it('returns ranked entries', async () => {
    const res = await leaderboardGET()
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      leaderboard: Array<{ rank: number; name: string; totalScore: number; avgScore: number }>
    }
    expect(Array.isArray(json.leaderboard)).toBe(true)
    expect(json.leaderboard.length).toBeGreaterThan(0)
    expect(json.leaderboard[0]?.rank).toBe(1)
  })

  it('ranks by total score descending', async () => {
    const res = await leaderboardGET()
    const json = (await res.json()) as {
      leaderboard: Array<{ totalScore: number }>
    }
    const scores = json.leaderboard.map((e) => e.totalScore)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]! <= scores[i - 1]!).toBe(true)
    }
  })

  it('includes avgScore per user', async () => {
    const res = await leaderboardGET()
    const json = (await res.json()) as { leaderboard: Array<{ avgScore: number }> }
    expect(typeof json.leaderboard[0]?.avgScore).toBe('number')
  })
})

// -----------------------------------------------------------------------
// History
// -----------------------------------------------------------------------
describe('GET /api/value-quiz/history', () => {
  it('returns attempt history with summary', async () => {
    const res = await historyGET()
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      attempts: Array<{ id: string; score: number; scoreLabel: string; percentageOff: number }>
      summary: { totalAttempts: number; avgScore: number; perfectGuesses: number }
    }
    expect(Array.isArray(json.attempts)).toBe(true)
    expect(json.summary.totalAttempts).toBe(json.attempts.length)
    expect(typeof json.summary.avgScore).toBe('number')
  })

  it('each attempt includes formatted values and deltaDirection', async () => {
    const res = await historyGET()
    const json = (await res.json()) as {
      attempts: Array<{ guessedFormatted: string; actualFormatted: string; deltaDirection: string }>
    }
    for (const a of json.attempts) {
      expect(a.guessedFormatted).toMatch(/^€/)
      expect(a.actualFormatted).toMatch(/^€/)
      expect(['over', 'under', 'exact']).toContain(a.deltaDirection)
    }
  })
})

// -----------------------------------------------------------------------
// Scoring utility (quizScore)
// -----------------------------------------------------------------------
describe('calcScore', () => {
  it('returns 100 for within 5%', async () => {
    const { calcScore } = await import('@/lib/quizScore')
    expect(calcScore(100_000_000, 4_000_000)).toBe(100)
    expect(calcScore(100_000_000, -4_000_000)).toBe(100)
  })

  it('returns 75 for within 10%', async () => {
    const { calcScore } = await import('@/lib/quizScore')
    expect(calcScore(100_000_000, 8_000_000)).toBe(75)
  })

  it('returns 50 for within 20%', async () => {
    const { calcScore } = await import('@/lib/quizScore')
    expect(calcScore(100_000_000, 15_000_000)).toBe(50)
  })

  it('returns 25 for within 40%', async () => {
    const { calcScore } = await import('@/lib/quizScore')
    expect(calcScore(100_000_000, 30_000_000)).toBe(25)
  })

  it('returns 0 for over 40% off', async () => {
    const { calcScore } = await import('@/lib/quizScore')
    expect(calcScore(100_000_000, 50_000_000)).toBe(0)
  })

  it('handles zero actual value gracefully', async () => {
    const { calcScore } = await import('@/lib/quizScore')
    expect(calcScore(0, 5_000_000)).toBe(0)
  })
})
