#!/usr/bin/env npx tsx
/**
 * Discovers navigable routes from app directory page.tsx/page.jsx files.
 * Ignores route groups such as (auth) and (marketing). Outputs JSON for Playwright theme audit.
 *
 * Usage: npx tsx scripts/discoverRoutes.ts [--output=path]
 * Output: routes.json with { routes: { path, pathname, skipReason? }[] }
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  BASE_URL,
  IGNORED_GROUPS,
  isProtectedPath,
  pathToTestUrl,
} from './audit-routes.config'

const APP_DIR = path.join(process.cwd(), 'app')

function isIgnoredSegment(segment: string): boolean {
  return IGNORED_GROUPS.some((g) => segment === g)
}

function discoverPageFiles(dir: string, segments: string[]): { pathname: string; segments: string[] }[] {
  const results: { pathname: string; segments: string[] }[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const segment = entry.name
    const fullPath = path.join(dir, segment)

    if (entry.isDirectory()) {
      if (isIgnoredSegment(segment)) continue
      results.push(...discoverPageFiles(fullPath, [...segments, segment]))
    } else if ((segment === 'page.tsx' || segment === 'page.jsx') && segments.length >= 0) {
      const pathname = '/' + segments.join('/')
      results.push({ pathname, segments })
    }
  }
  return results
}

function main() {
  const outArg = process.argv.find((a) => a.startsWith('--output='))
  const outputPath = outArg ? outArg.split('=')[1] : path.join(process.cwd(), 'tests', 'ui', 'routes.json')

  const discovered = discoverPageFiles(APP_DIR, [])
  const routes = discovered.map(({ pathname }) => {
    const skipReason = isProtectedPath(pathname)
      ? 'Requires auth (redirects to login); add test user or run with auth state to include.'
      : undefined
    return {
      path: pathToTestUrl(pathname),
      pathname,
      skipReason,
    }
  })

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes,
  }

  const outDir = path.dirname(outputPath)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')

  console.log(`Discovered ${routes.length} routes. Skipped (auth): ${routes.filter((r) => r.skipReason).length}`)
  console.log(`Wrote ${outputPath}`)
}

main()
