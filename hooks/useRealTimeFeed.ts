'use client'

import { useEffect, useRef, useState } from 'react'

interface NewPostEvent {
  type: 'posts'
  posts: unknown[]
}

/**
 * Subscribes to the SSE feed stream and returns the count of new posts
 * since the component mounted. Caller can use the count to show a "X new posts" banner.
 */
export function useRealTimeFeed(enabled = true) {
  const [newCount, setNewCount] = useState(0)
  const sinceRef = useRef(new Date().toISOString())
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return

    const connect = () => {
      const url = `/api/feed/stream?since=${encodeURIComponent(sinceRef.current)}`
      const es = new EventSource(url)
      esRef.current = es

      es.onmessage = (e) => {
        if (!e.data || e.data.startsWith(':')) return
        try {
          const payload = JSON.parse(e.data) as NewPostEvent
          if (payload.type === 'posts' && payload.posts.length > 0) {
            setNewCount((n) => n + payload.posts.length)
            sinceRef.current = new Date().toISOString()
          }
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        // Reconnect after 5s on error
        setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      esRef.current = null
    }
  }, [enabled])

  const clearNewCount = () => {
    setNewCount(0)
    sinceRef.current = new Date().toISOString()
  }

  return { newCount, clearNewCount }
}
