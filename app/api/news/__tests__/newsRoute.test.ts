import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/news/route'

vi.mock('@/lib/db', () => {
  const mockItems = [
    {
      id: 'n1',
      title: 'Earlier story',
      summary: null,
      source: null,
      url: null,
      imageUrl: null,
      publishedAt: new Date('2024-01-01T10:00:00.000Z'),
      competitionId: null,
      teamId: null,
      playerId: null,
      scope: 'LATEST',
    },
    {
      id: 'n2',
      title: 'Latest headline',
      summary: null,
      source: null,
      url: null,
      imageUrl: null,
      publishedAt: new Date('2024-01-01T12:00:00.000Z'),
      competitionId: null,
      teamId: null,
      playerId: null,
      scope: 'LATEST',
    },
  ]

  return {
    db: {
      follow: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      newsItem: {
        findMany: vi.fn().mockImplementation(async () => {
          return [...mockItems].sort(
            (left, right) =>
              (right.publishedAt as Date).getTime() - (left.publishedAt as Date).getTime(),
          )
        }),
      },
    },
  }
})

vi.mock('@/lib/auth', () => {
  return {
    getAuthedUserId: vi.fn().mockResolvedValue('user-1'),
  }
})

describe('/api/news route', () => {
  it('returns latest items sorted by publishedAt desc', async () => {
    const req = new Request('http://localhost/api/news?scope=latest')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { items: { id: string; publishedAt: string }[] }

    expect(json.items).toHaveLength(2)
    expect(json.items[0].id).toBe('n2')
    expect(json.items[1].id).toBe('n1')
  })
})

