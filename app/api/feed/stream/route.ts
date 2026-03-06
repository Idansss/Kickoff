import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Simple in-memory pub/sub for new posts
const subscribers = new Set<(data: string) => void>()

export function notifyNewPost(postData: object) {
  const payload = `data: ${JSON.stringify(postData)}\n\n`
  subscribers.forEach((fn) => fn(payload))
}

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get('since')
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000)

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send any posts newer than `since` immediately
      try {
        const newPosts = await db.post.findMany({
          where: {
            createdAt: { gt: sinceDate },
            relatedMatchId: null, // exclude stories
          },
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })

        if (newPosts.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'posts', posts: newPosts })}\n\n`)
          )
        }
      } catch {
        // DB not ready, that's ok
      }

      // Keep-alive ping every 20s
      const pingInterval = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(pingInterval)
        }
      }, 20000)

      // Subscribe to new post notifications
      const listener = (payload: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(payload))
        } catch {
          subscribers.delete(listener)
        }
      }
      subscribers.add(listener)

      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(pingInterval)
        subscribers.delete(listener)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
