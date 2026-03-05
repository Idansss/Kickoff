'use client'

import React from 'react'

/**
 * Splits text by query (case-insensitive) and wraps matching segments in a green bold span.
 * Returns a React node (array of strings and spans).
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)
  return (
    <>
      {before}
      <span style={{ color: '#16a34a', fontWeight: 700 }}>{match}</span>
      {after}
    </>
  )
}

/**
 * Highlights all occurrences of query in text (case-insensitive).
 * Used when the match might appear multiple times.
 */
export function highlightMatchAll(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const q = query.trim().toLowerCase()
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    const lower = remaining.toLowerCase()
    const idx = lower.indexOf(q)
    if (idx === -1) {
      parts.push(remaining)
      break
    }
    if (idx > 0) parts.push(remaining.slice(0, idx))
    parts.push(
      <span key={key++} style={{ color: '#16a34a', fontWeight: 700 }}>
        {remaining.slice(idx, idx + q.length)}
      </span>
    )
    remaining = remaining.slice(idx + q.length)
  }
  return <>{parts}</>
}
