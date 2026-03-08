/**
 * Config for Dark Mode UI Audit: which routes to test and how to resolve dynamic segments.
 * Sync PROTECTED_PATHS with middleware.ts when adding protected routes.
 */

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

/** Routes that redirect to login when unauthenticated (skip in audit with reason). */
export const PROTECTED_PATHS = ['/settings', '/profile/edit'] as const

/** Placeholder values for dynamic segments when building test URLs. */
export const DYNAMIC_SEGMENT_PLACEHOLDERS: Record<string, string> = {
  '[id]': '1',
  '[tag]': 'premierleague',
  '[matchId]': '1',
}

/** Route groups to ignore (Next.js private/group routes, e.g. (auth), (marketing)). */
export const IGNORED_GROUPS = ['(auth)', '(marketing)', '(dashboard)'] as const

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p))
}

export function pathToTestUrl(pathname: string): string {
  let url = pathname
  for (const [segment, value] of Object.entries(DYNAMIC_SEGMENT_PLACEHOLDERS)) {
    url = url.replace(new RegExp(segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }
  return `${BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}
