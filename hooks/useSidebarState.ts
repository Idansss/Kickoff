'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'kickoff-sidebar'

function readStored(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return true
    return stored === 'true'
  } catch {
    return true
  }
}

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    setIsOpen(readStored())
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return { isOpen, toggle }
}
