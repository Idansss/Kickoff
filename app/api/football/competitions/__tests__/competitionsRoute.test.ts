import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/football/competitions/route'

vi.mock('@/lib/db', () => {
  return {
    db: {
      competition: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'c1', name: 'Premier League', country: 'England', type: 'league', logoUrl: null },
          { id: 'c2', name: 'FA Cup', country: 'England', type: 'cup', logoUrl: null },
          { id: 'c3', name: 'UEFA Champions League', country: 'Europe', type: 'international', logoUrl: null },
        ]),
      },
    },
  }
})

describe('/api/football/competitions route', () => {
  it('returns grouped competitions for leagues, cups and international', async () => {
    const res = await GET()
    expect(res.status).toBe(200)

    const json = (await res.json()) as {
      leagues: Array<{ id: string }>
      cups: Array<{ id: string }>
      international: Array<{ id: string }>
    }

    expect(json.leagues).toBeDefined()
    expect(json.cups).toBeDefined()
    expect(json.international).toBeDefined()
    expect(json.leagues[0].id).toBe('c1')
    expect(json.cups[0].id).toBe('c2')
    expect(json.international[0].id).toBe('c3')
  })
})

