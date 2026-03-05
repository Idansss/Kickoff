const RECENT_SEARCHES_KEY = 'kickoff-recent-searches'
const MAX_RECENT = 5

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function addRecentSearch(term: string): void {
  const t = term.trim()
  if (!t) return
  const list = getRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase())
  const next = [t, ...list].slice(0, MAX_RECENT)
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function removeRecentSearch(term: string): void {
  const list = getRecentSearches().filter((x) => x !== term)
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    // ignore
  }
}
