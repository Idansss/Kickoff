import { describe, expect, it, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/follow/route'

type FollowRecord = {
  userId: string
  entityType: 'TEAM' | 'PLAYER' | 'MATCH' | 'COMPETITION'
  entityId: string
}

const memory: FollowRecord[] = []

vi.mock('@/lib/auth', () => ({
  getAuthedUserId: vi.fn().mockResolvedValue('user-1'),
}))

vi.mock('@/lib/db', () => {
  return {
    db: {
      follow: {
        upsert: vi.fn(async ({ where }: any) => {
          const { userId, entityType, entityId } = where.userId_entityType_entityId
          const existing = memory.find(
            (f) =>
              f.userId === userId && f.entityType === entityType && f.entityId === entityId
          )
          if (!existing) {
            memory.push({ userId, entityType, entityId })
          }
          return null
        }),
        deleteMany: vi.fn(async ({ where }: any) => {
          const before = memory.length
          for (let i = memory.length - 1; i >= 0; i -= 1) {
            const f = memory[i]
            if (
              f.userId === where.userId &&
              f.entityType === where.entityType &&
              f.entityId === where.entityId
            ) {
              memory.splice(i, 1)
            }
          }
          return { count: before - memory.length }
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          const key = where.userId_entityType_entityId
          return (
            memory.find(
              (f) =>
                f.userId === key.userId &&
                f.entityType === key.entityType &&
                f.entityId === key.entityId
            ) ?? null
          )
        }),
        findMany: vi.fn(async ({ where }: any) => {
          return memory.filter((f) => f.userId === where.userId)
        }),
      },
      team: {
        findMany: vi.fn(async () => []),
      },
      player: {
        findMany: vi.fn(async () => []),
      },
      match: {
        findMany: vi.fn(async () => []),
      },
      competition: {
        findMany: vi.fn(async () => []),
      },
    },
  }
})

describe('/api/follow route', () => {
  beforeEach(() => {
    memory.splice(0, memory.length)
  })

  it('POST FOLLOW then GET indicates following true', async () => {
    const followReq = new Request('http://localhost/api/follow', {
      method: 'POST',
      body: JSON.stringify({
        action: 'FOLLOW',
        entityType: 'TEAM',
        entityId: 't1',
      }),
    })

    const postRes = await POST(followReq as any)
    expect(postRes.status).toBe(200)
    const postJson = (await postRes.json()) as { following: boolean }
    expect(postJson.following).toBe(true)

    const getRes = await GET(
      new Request('http://localhost/api/follow?entityType=TEAM&entityId=t1') as any
    )
    expect(getRes.status).toBe(200)
    const getJson = (await getRes.json()) as { following: boolean }
    expect(getJson.following).toBe(true)
  })
})

