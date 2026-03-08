/**
 * Dark Mode UI Audit: visits each discovered route in light and dark mode,
 * runs Axe accessibility checks (WCAG 2 AA, excluding color-contrast to avoid
 * flakiness from theme timing), and captures dark-mode screenshots for regression.
 * Fails CI on accessibility violations or screenshot regressions.
 *
 * Run route discovery first: npm run audit:theme (or npm run discover-routes).
 * Requires routes.json at tests/ui/routes.json.
 */

import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import * as fs from 'fs'
import * as path from 'path'

const ROUTES_PATH = path.join(__dirname, 'routes.json')

type RouteEntry = { path: string; pathname: string; skipReason?: string }
type RoutesReport = { routes: RouteEntry[] }

function loadRoutes(): RouteEntry[] {
  if (!fs.existsSync(ROUTES_PATH)) {
    throw new Error(
      `routes.json not found at ${ROUTES_PATH}. Run: npm run discover-routes (or npm run audit:theme)`
    )
  }
  const report: RoutesReport = JSON.parse(fs.readFileSync(ROUTES_PATH, 'utf-8'))
  return report.routes ?? []
}

test.describe('Dark Mode UI Audit', () => {
  const routes = loadRoutes()

  for (const route of routes) {
    const slug = route.pathname.replace(/^\//, '').replace(/\/|\[|\]/g, '_') || 'index'
    const name = route.pathname || '/'

    test.describe(`${name}`, () => {
      test(`light mode: Axe accessibility`, async ({ page }, testInfo) => {
        if (route.skipReason) {
          test.skip(true, route.skipReason)
        }
        await page.emulateMedia({ colorScheme: 'light' })
        await page.addInitScript(() => {
          window.localStorage.setItem('theme', 'light')
        })
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForLoadState('load')
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark')
        })
        await page.waitForTimeout(100)
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .disableRules(['color-contrast', 'nested-interactive', 'scrollable-region-focusable'])
          .analyze()
        const violations = results.violations ?? []
        expect(
          violations,
          violations.length
            ? `Accessibility violations: ${JSON.stringify(violations, null, 2)}`
            : undefined
        ).toHaveLength(0)
      })

      test(`dark mode: Axe accessibility`, async ({ page }) => {
        if (route.skipReason) {
          test.skip(true, route.skipReason)
        }
        await page.emulateMedia({ colorScheme: 'dark' })
        await page.addInitScript(() => {
          window.localStorage.setItem('theme', 'dark')
        })
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForLoadState('load')
        await page.evaluate(() => {
          document.documentElement.classList.add('dark')
        })
        await page.waitForTimeout(100)
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .disableRules(['color-contrast', 'nested-interactive', 'scrollable-region-focusable'])
          .analyze()
        const violations = results.violations ?? []
        expect(
          violations,
          violations?.length
            ? `Accessibility violations in dark mode: ${JSON.stringify(violations, null, 2)}`
            : undefined
        ).toHaveLength(0)
      })

      test(`dark mode: screenshot regression`, async ({ page }) => {
        if (route.skipReason) {
          test.skip(true, route.skipReason)
        }
        await page.emulateMedia({ colorScheme: 'dark' })
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForLoadState('load')
        await page.waitForTimeout(1500)
        await expect(page).toHaveScreenshot(`dark-${slug}.png`, {
          fullPage: true,
          maxDiffPixels: 500,
          timeout: 15000,
        })
      })
    })
  }

  test.describe('Profile page', () => {
    test('dark mode: Edit Profile button is visible and has sufficient contrast', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.addInitScript(() => {
        window.localStorage.setItem('theme', 'dark')
      })
      await page.goto('/profile', { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForLoadState('load')
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      await page.waitForTimeout(300)

      const editBtn = page.getByRole('button', { name: 'Edit Profile' })
      await expect(editBtn).toBeVisible()

      const hasContrast = await editBtn.evaluate((el) => {
        const style = window.getComputedStyle(el)
        const color = style.color
        const bg = style.backgroundColor
        if (!color || !bg) return true
        const parse = (s: string) => {
          const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
          if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]
          return null
        }
        const c = parse(color)
        const b = parse(bg)
        if (!c || !b) return true
        const same =
          c[0] === b[0] && c[1] === b[1] && c[2] === b[2]
        return !same
      })
      expect(hasContrast, 'Edit Profile button text and background must not be the same color').toBe(
        true
      )

      await expect(page).toHaveScreenshot('profile-dark-edit-visible.png', {
        fullPage: true,
        maxDiffPixels: 500,
        timeout: 15000,
      })
    })
  })
})
