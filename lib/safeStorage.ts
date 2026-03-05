import type { StateStorage } from 'zustand/middleware'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function safeGet<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function safeSet<T>(key: string, value: T): void {
  if (!isBrowser()) return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures (quota/private mode)
  }
}

export const safeStorage: StateStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Ignore storage failures (quota/private mode)
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser()) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore storage failures
    }
  },
}
