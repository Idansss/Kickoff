import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll<T>(items: readonly T[], pageSize = 20) {
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const displayed = items.slice(0, page * pageSize)
  const hasMore = displayed.length < items.length

  useEffect(() => {
    setPage(1)
  }, [items.length])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1)
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  return { displayed, hasMore, sentinelRef }
}
