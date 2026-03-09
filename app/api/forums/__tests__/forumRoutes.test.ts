import { GET as categoriesGET } from '../categories/route'
import { GET as categoryGET, POST as categoryPOST } from '../[category]/route'
import { GET as threadGET, POST as threadPOST } from '../thread/[id]/route'
import { POST as subscribePOST, DELETE as subscribeDELETE } from '../thread/[id]/subscribe/route'
import { GET as searchGET } from '../search/route'
import type { NextRequest } from 'next/server'

// vi.mock is hoisted — all data must be inside the factory to avoid TDZ errors
vi.mock('@/lib/db', () => {
  const CATEGORIES = [
    {
      id: 'cat1',
      slug: 'transfers',
      name: 'Transfers',
      description: 'Transfer rumours and news',
      threads: [
        {
          id: 'thread1',
          title: 'Mbappe to Real Madrid?',
          updatedAt: new Date(),
          posts: [{ createdAt: new Date(), authorId: 'u1' }],
        },
      ],
    },
    {
      id: 'cat2',
      slug: 'tactics',
      name: 'Tactics',
      description: null,
      threads: [],
    },
  ]

  const CATEGORY = {
    id: 'cat1',
    slug: 'transfers',
    name: 'Transfers',
    description: 'Transfer rumours and news',
  }

  const THREADS = [
    {
      id: 'thread1',
      title: 'Mbappe to Real Madrid?',
      isRumour: true,
      relatedClubId: null,
      relatedPlayerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [{ tag: { name: 'Transfer', slug: 'transfer' } }],
      _count: { posts: 5 },
      posts: [{ createdAt: new Date() }],
    },
  ]

  const THREAD = {
    id: 'thread1',
    title: 'Mbappe to Real Madrid?',
    isRumour: true,
    relatedClubId: null,
    relatedPlayerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat1', slug: 'transfers', name: 'Transfers' },
    tags: [{ tag: { name: 'Transfer', slug: 'transfer' } }],
    _count: { posts: 3 },
  }

  const POSTS = [
    { id: 'post1', content: 'Great rumour!', authorId: 'u1', createdAt: new Date(), updatedAt: new Date(), threadId: 'thread1' },
    { id: 'post2', content: 'Unlikely in my view', authorId: 'u2', createdAt: new Date(), updatedAt: new Date(), threadId: 'thread1' },
  ]

  const SUBSCRIPTION = { id: 'sub1', threadId: 'thread1', userId: 'u1' }

  return {
    db: {
      forumCategory: {
        findMany: vi.fn().mockResolvedValue(CATEGORIES),
        findUnique: vi.fn().mockResolvedValue(CATEGORY),
      },
      forumThread: {
        findMany: vi.fn().mockResolvedValue(THREADS),
        findUnique: vi.fn().mockResolvedValue(THREAD),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue({
          id: 'thread2',
          title: 'New thread',
          createdAt: new Date(),
          _count: { posts: 1 },
          tags: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      forumPost: {
        findMany: vi.fn().mockResolvedValue(POSTS),
        count: vi.fn().mockResolvedValue(2),
        create: vi.fn().mockResolvedValue({
          id: 'post3',
          content: 'My reply',
          authorId: 'u1',
          createdAt: new Date(),
          threadId: 'thread1',
        }),
      },
      forumThreadSubscription: {
        count: vi.fn().mockResolvedValue(3),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(SUBSCRIPTION),
        delete: vi.fn().mockResolvedValue(SUBSCRIPTION),
      },
      forumTag: {
        upsert: vi.fn().mockResolvedValue({ id: 'tag1', name: 'Transfer', slug: 'transfer' }),
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

function makeContext(params: Record<string, string>) {
  return { params: Promise.resolve(params) }
}

// -----------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------
describe('GET /api/forums/categories', () => {
  it('returns list of categories', async () => {
    const res = await categoriesGET()
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { categories: Array<{ slug: string; threadCount: number }> }
    expect(json.categories.length).toBe(2)
    // mock returns transfers first (index 0); DB ordering is mocked out
    expect(json.categories[0]?.slug).toBe('transfers')
    expect(json.categories[0]?.threadCount).toBe(1)
  })

  it('includes latestActivity from latest post', async () => {
    const res = await categoriesGET()
    const json = (await res.json()) as { categories: Array<{ latestActivity: string | null }> }
    // tactics has no threads → null; transfers has posts → date
    const tactics = json.categories.find((c: { slug?: string }) => c.slug === 'tactics')
    expect(tactics?.latestActivity).toBeNull()
    const transfers = json.categories.find((c: { slug?: string }) => c.slug === 'transfers')
    expect(transfers?.latestActivity).not.toBeNull()
  })
})

// -----------------------------------------------------------------------
// Category threads — GET
// -----------------------------------------------------------------------
describe('GET /api/forums/[category]', () => {
  const base = 'http://localhost/api/forums/transfers'

  it('returns paginated threads', async () => {
    const res = await categoryGET(makeRequest(base), makeContext({ category: 'transfers' }))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      category: { name: string }
      results: Array<{ id: string; replyCount: number }>
      total: number
    }
    expect(json.category.name).toBe('Transfers')
    expect(json.total).toBe(1)
    expect(json.results[0]?.replyCount).toBe(5)
  })

  it('returns 400 for invalid page param', async () => {
    const res = await categoryGET(
      makeRequest(`${base}?page=0`),
      makeContext({ category: 'transfers' }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown category', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumCategory.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await categoryGET(
      makeRequest('http://localhost/api/forums/unknown'),
      makeContext({ category: 'unknown' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty category slug', async () => {
    const res = await categoryGET(makeRequest('http://localhost/api/forums/'), makeContext({ category: '' }))
    expect(res.status).toBe(400)
  })
})

// -----------------------------------------------------------------------
// Category threads — POST (create thread)
// -----------------------------------------------------------------------
describe('POST /api/forums/[category]', () => {
  it('creates a thread and returns 201', async () => {
    const res = await categoryPOST(
      makeRequest('http://localhost/api/forums/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test thread title', body: 'This is my first post body text', tags: ['Transfer'] }),
      }),
      makeContext({ category: 'transfers' }),
    )
    expect(res.status).toBe(201)
    const json = (await res.json()) as { thread: { id: string; categorySlug: string } }
    expect(json.thread.categorySlug).toBe('transfers')
  })

  it('returns 400 if title too short', async () => {
    const res = await categoryPOST(
      makeRequest('http://localhost/api/forums/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hi', body: 'This is my first post body text' }),
      }),
      makeContext({ category: 'transfers' }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 if body too short', async () => {
    const res = await categoryPOST(
      makeRequest('http://localhost/api/forums/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Valid thread title', body: 'short' }),
      }),
      makeContext({ category: 'transfers' }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 if category not found', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumCategory.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await categoryPOST(
      makeRequest('http://localhost/api/forums/nope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Valid thread title', body: 'This is my first post body text' }),
      }),
      makeContext({ category: 'nope' }),
    )
    expect(res.status).toBe(404)
  })
})

// -----------------------------------------------------------------------
// Thread detail — GET
// -----------------------------------------------------------------------
describe('GET /api/forums/thread/[id]', () => {
  it('returns thread with posts', async () => {
    const res = await threadGET(makeRequest('http://localhost/api/forums/thread/thread1'), makeContext({ id: 'thread1' }))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as {
      thread: { title: string; totalPosts: number; isSubscribed: boolean }
      posts: Array<{ id: string }>
      totalPosts: number
    }
    expect(json.thread.title).toBe('Mbappe to Real Madrid?')
    expect(json.posts.length).toBe(2)
    expect(json.thread.isSubscribed).toBe(false)
  })

  it('returns 404 for unknown thread', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumThread.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await threadGET(
      makeRequest('http://localhost/api/forums/thread/nope'),
      makeContext({ id: 'nope' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty id', async () => {
    const res = await threadGET(makeRequest('http://localhost/api/forums/thread/'), makeContext({ id: '' }))
    expect(res.status).toBe(400)
  })
})

// -----------------------------------------------------------------------
// Thread reply — POST
// -----------------------------------------------------------------------
describe('POST /api/forums/thread/[id]', () => {
  it('creates a reply and returns 201', async () => {
    const res = await threadPOST(
      makeRequest('http://localhost/api/forums/thread/thread1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Great point mate!' }),
      }),
      makeContext({ id: 'thread1' }),
    )
    expect(res.status).toBe(201)
    const json = (await res.json()) as { post: { content: string } }
    expect(json.post.content).toBe('My reply')
  })

  it('returns 400 if content empty', async () => {
    const res = await threadPOST(
      makeRequest('http://localhost/api/forums/thread/thread1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      }),
      makeContext({ id: 'thread1' }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 if thread not found', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumThread.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await threadPOST(
      makeRequest('http://localhost/api/forums/thread/missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Hello there' }),
      }),
      makeContext({ id: 'missing' }),
    )
    expect(res.status).toBe(404)
  })
})

// -----------------------------------------------------------------------
// Subscribe — POST (toggle)
// -----------------------------------------------------------------------
describe('POST /api/forums/thread/[id]/subscribe', () => {
  it('subscribes when not yet subscribed', async () => {
    const res = await subscribePOST(
      makeRequest('http://localhost/', { method: 'POST' }),
      makeContext({ id: 'thread1' }),
    )
    expect(res.status).toBe(201)
    const json = (await res.json()) as { subscribed: boolean }
    expect(json.subscribed).toBe(true)
  })

  it('unsubscribes (toggle) when already subscribed', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumThreadSubscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'sub1',
      threadId: 'thread1',
      userId: 'u1',
    })
    const res = await subscribePOST(
      makeRequest('http://localhost/', { method: 'POST' }),
      makeContext({ id: 'thread1' }),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { subscribed: boolean }
    expect(json.subscribed).toBe(false)
  })

  it('returns 404 if thread not found', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumThread.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await subscribePOST(
      makeRequest('http://localhost/', { method: 'POST' }),
      makeContext({ id: 'gone' }),
    )
    expect(res.status).toBe(404)
  })
})

// -----------------------------------------------------------------------
// Subscribe — DELETE (explicit unsubscribe)
// -----------------------------------------------------------------------
describe('DELETE /api/forums/thread/[id]/subscribe', () => {
  it('unsubscribes successfully', async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumThreadSubscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'sub1',
      threadId: 'thread1',
      userId: 'u1',
    })
    const res = await subscribeDELETE(
      makeRequest('http://localhost/', { method: 'DELETE' }),
      makeContext({ id: 'thread1' }),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { subscribed: boolean }
    expect(json.subscribed).toBe(false)
  })

  it('returns subscribed:false even if not subscribed', async () => {
    const res = await subscribeDELETE(
      makeRequest('http://localhost/', { method: 'DELETE' }),
      makeContext({ id: 'thread1' }),
    )
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { subscribed: boolean }
    expect(json.subscribed).toBe(false)
  })
})

// -----------------------------------------------------------------------
// Search
// -----------------------------------------------------------------------
describe('GET /api/forums/search', () => {
  const base = 'http://localhost/api/forums/search'

  beforeEach(async () => {
    const { db } = await import('@/lib/db')
    ;(db.forumThread.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'thread1',
        title: 'Mbappe to Real Madrid?',
        isRumour: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { id: 'cat1', slug: 'transfers', name: 'Transfers' },
        tags: [],
        _count: { posts: 5 },
        posts: [{ createdAt: new Date() }],
      },
    ])
    ;(db.forumThread.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
  })

  it('returns search results', async () => {
    const res = await searchGET(makeRequest(`${base}?q=mbappe`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { results: Array<{ id: string }>; total: number; query: string }
    expect(json.query).toBe('mbappe')
    expect(json.total).toBe(1)
    expect(json.results[0]?.id).toBe('thread1')
  })

  it('returns 400 when q is missing', async () => {
    const res = await searchGET(makeRequest(base))
    expect(res.status).toBe(400)
  })

  it('returns 400 when q is empty string', async () => {
    const res = await searchGET(makeRequest(`${base}?q=`))
    expect(res.status).toBe(400)
  })

  it('paginates correctly', async () => {
    const res = await searchGET(makeRequest(`${base}?q=transfer&page=1&pageSize=1`))
    expect(res.ok).toBe(true)
    const json = (await res.json()) as { totalPages: number }
    expect(json.totalPages).toBe(1)
  })
})
