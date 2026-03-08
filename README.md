# KICKOFF

KICKOFF is a football social super-app built with Next.js, React, TypeScript, Zustand, and Prisma.

The app combines:
- **Social feed** – posts, replies, reposts, polls, bookmarks, hashtags, mentions
- **Live match center** – ticker, xG, timeline, momentum, shot map, reminders
- **Chat rooms** – group and direct messages
- **Discovery** – players, transfers, standings, trending
- **AI** – FootballGPT (Claude + xAI), scout reports, match previews
- **Profile** – XP/level/streak/badges, notifications, settings

**Design:** Dark-first UI with a full black theme; emerald green accents. Light mode supported. Responsive layout with sidebar navigation.

## 1) Tech Stack

- Framework: Next.js 16 (App Router)
- UI: React 19 + Tailwind CSS + Radix UI primitives
- Language: TypeScript (strict mode)
- State: Zustand + persist middleware
- Data layer: Prisma ORM + SQLite (default local db)
- AI: Anthropic Claude via server-side API routes
- Testing: Vitest + Testing Library, Playwright (theme/accessibility audit)
- Analytics: Vercel Analytics

**Theme:** Full black dark mode (`#000000` / `#0a0a0a`), emerald green accents (`#22c55e`). CSS variables in `app/globals.css`; Tailwind theme in `tailwind.config.ts`. Browser theme color follows light/dark preference.

## 2) Quick Start

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set values (see `.env.example` for a full template):

- `DATABASE_URL` – Prisma (default SQLite: `file:./dev.db`)
- `ANTHROPIC_API_KEY` – FootballGPT with **Claude** ([Anthropic Console](https://console.anthropic.com/))
- `XAI_API_KEY` – FootballGPT with **xAI (Grok)** ([xAI Console](https://console.x.ai/))
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` – optional; for [Supabase](https://supabase.com) (Auth/DB). From project **Settings → API**.

### Database

```bash
npm run db:migrate
npm run db:seed
```

To seed the **production** database (e.g. on Vercel), set `DATABASE_URL` to your production connection string and run the same command once:  
`DATABASE_URL="your-production-url" npm run db:seed`

### Persistence (profile, posts, comments)

Profile (name, handle, bio, avatar, header), posts, bookmarks, likes, and comments are stored in the browser via **Zustand + localStorage**. Reloading the page keeps your data on the same device.

For **cross-device** sync and **real multi-user** behaviour (e.g. other users see your posts, one account on phone and desktop), add a backend such as **Supabase**. The app includes `@supabase/supabase-js` and a client in `lib/supabase/client.ts`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env` (from the Supabase dashboard → Settings → API), then use `getSupabaseClient()` where Supabase is optional or `createClient()` where it is required.

### Run

```bash
npm run dev
```

Open: `http://localhost:3000`

## 3) Project Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run start` - Run built app
- `npm run lint` - ESLint checks
- `npm run test` - Run Vitest
- `npm run test:coverage` - Vitest with coverage report
- `npm run test:ui` - Run Playwright UI tests (theme audit, etc.)
- `npm run discover-routes` - Discover app routes into `tests/ui/routes.json` (used by theme audit)
- `npm run audit:theme` - Run Dark Mode UI audit (discover routes + Playwright theme-audit tests)
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed local DB
- `npm run db:studio` - Open Prisma Studio

## 4) App Routes

### Core pages

- `/feed` - Main social feed
- `/chat` - Chat room list
- `/chat/[id]` - Single chat room
- `/matches` - Live and upcoming matches
- `/ai` - FootballGPT chat
- `/discovery` - Players, transfers, standings, trending
- `/profile` - Current user profile, XP, badges, bookmarks
- `/settings` - Account, notifications, favorites, theme

### Detail pages

- `/player/[id]` - Player profile + AI scout report
- `/club/[id]` - Club profile + squad
- `/match/[id]` - Match detail + related posts (legacy data path)
- `/user/[id]` - User profile (legacy data path)

### Extra/dev pages

- `/design` - Design component demo wrapper
- `/kickoff` - Legacy standalone prototype page
- `/` - Redirects to `/feed`

## 5) API Routes

- `POST /api/footballgpt`
  - AI football Q&A
  - Input validation and length limits
- `POST /api/scout-report`
  - AI scout report for player payload
- `POST /api/match-preview`
  - AI fixture preview
- `GET /api/messages?roomId=...`
  - Fetch room messages
- `POST /api/messages`
  - Send message
- `GET /api/posts`
  - Fetch feed posts
- `POST /api/posts`
  - Create post
- `DELETE /api/posts/[id]`
  - Delete own post
- `POST /api/posts/[id]/like`
  - Toggle like
- `POST /api/posts/[id]/repost`
  - Toggle repost
- `GET /api/posts/[id]/reply`
  - Fetch replies
- `POST /api/posts/[id]/reply`
  - Create reply

## 6) State Management (Zustand)

### Stores

- `store/feedStore.ts`
  - Posts, bookmarks, poll voting, replies, repost/undo, mute/block/hide, trending topics
- `store/matchStore.ts`
  - Live matches, upcoming fixtures, predictions, reminders, minute ticker
- `store/chatStore.ts`
  - Rooms, active room, room messages, read state
- `store/userStore.ts`
  - Current user, notifications, settings, XP/levels, streaks, badges, follows
- `store/uiStore.ts`
  - Global UI state (post modal, sidebar open)
- `store/toastStore.ts`
  - Global toast with optional undo callback

### Persisted keys

Defined in `lib/constants.ts`:
- `kickoff-feed`
- `kickoff-user`
- `kickoff-matches`
- `kickoff-chat`
- `kickoff-ui`
- `kickoff-last-streak-date`

Local storage access is wrapped with safe utilities in `lib/safeStorage.ts`.

## 7) Domain Types

Canonical shared types are in `types/index.ts`, including:
- `User`, `Post`, `Reply`, `Poll`, `Match`, `Player`, `Transfer`
- `Notification`, `Prediction`, `ChatRoom`, `Message`, `AppSettings`
- Legacy interfaces used by older pages (`Legacy*`)

## 8) Database (Prisma)

Schema: `prisma/schema.prisma`

Models:
- `User`
- `Post` (supports reply threading via `parentId`)
- `Like`
- `UserRepost`
- `Message`

Prisma client output is generated to:
- `lib/generated/prisma`

## 9) Dark Mode UI Audit

Automated checks for **dark mode** and **accessibility** across all navigable routes.

### What it does

- **Route discovery**  
  `scripts/discoverRoutes.ts` finds every `app/**/page.tsx` (and `page.jsx`), ignores route groups like `(auth)` / `(marketing)`, and writes `tests/ui/routes.json`. Dynamic segments (e.g. `[id]`, `[tag]`) are filled with placeholders from `scripts/audit-routes.config.ts`.

- **Playwright tests** (`tests/ui/theme-audit.spec.ts`)  
  For each route (except those that require auth, which are skipped with a clear reason):

  - **Light and dark mode**  
    Each page is opened with the correct theme: `localStorage.theme` is set before load, and the document `dark` class is applied or removed so Axe runs against the intended theme.
  - **Axe**  
    [Axe](https://github.com/dequelabs/axe-core) runs with WCAG 2 AA tags. The rules **color-contrast**, **nested-interactive**, and **scrollable-region-focusable** are disabled to avoid flakiness from theme timing and known UI patterns; other accessibility violations fail the run.
  - **Screenshots**  
    A full-page screenshot is taken in **dark mode** and compared to the last accepted snapshot. Changes cause a failure (regression).

- **Auth**  
  Routes listed as protected in `scripts/audit-routes.config.ts` (e.g. `/settings`, `/profile/edit`) redirect to login when unauthenticated. They are **skipped** in the audit with a message like: *"Requires auth (redirects to login); add test user or run with auth state to include."* To audit them, run the app with a logged-in session and use a Playwright [storage state](https://playwright.dev/docs/auth) (or add a test-user login helper) and extend the config.

### How to run

0. **First time:** install Playwright browsers (e.g. Chromium):
   ```bash
   npx playwright install chromium
   ```

1. **Generate routes (optional; also run automatically by `audit:theme`):**
   ```bash
   npm run discover-routes
   ```

2. **Run the theme audit (starts dev server if needed, then runs the audit):**
   ```bash
   npm run audit:theme
   ```

   Or run all Playwright UI tests (same theme-audit spec if that’s all you have):
   ```bash
   npm run test:ui
   ```

   For the first run, **accept the dark-mode snapshots** as baseline:
   ```bash
   npx playwright test tests/ui/theme-audit.spec.ts --update-snapshots
   ```

3. **CI**  
   - Run the app (e.g. `npm run build && npm run start`), then run the audit against that URL, e.g.:
     ```bash
     PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run audit:theme
     ```
   - Or start the app in the background and use `PLAYWRIGHT_BASE_URL`; Playwright will not start its own `webServer` when `CI` is set.
   - Commit `tests/ui/snapshots/theme-audit/` (and `tests/ui/routes.json` if you want) so CI can compare screenshots and fail on contrast or visual regression.

### How to interpret failures

- **Axe violations**  
  The test output and report (e.g. `playwright-report/index.html`) list failing rules and nodes. Fix contrast (or other a11y issues) or add justified exceptions in the test.
- **Screenshot diff**  
  Dark-mode UI changed compared to the last accepted snapshot. If the change is intentional, update the baseline:
  ```bash
  npx playwright test tests/ui/theme-audit.spec.ts --update-snapshots
  ```
  Then commit the updated files under `tests/ui/snapshots/theme-audit/`.

### Files

- `scripts/discoverRoutes.ts` – discovers routes, writes `tests/ui/routes.json`
- `scripts/audit-routes.config.ts` – base URL, protected paths, dynamic-segment placeholders, ignored route groups
- `tests/ui/theme-audit.spec.ts` – Playwright tests (light/dark Axe + dark screenshot regression)
- `tests/ui/routes.json` – generated list of routes (committed so `test:ui` works without running discovery first)
- `playwright.config.ts` – Playwright config (test dir, base URL, snapshot path, optional dev server)

## 10) AI Integration

Client AI helpers:
- `lib/claudeClient.ts` calls internal API routes only

Server Anthropic wrapper:
- `lib/anthropic.ts`

Behavior:
- Request timeout
- Retry once on failure
- User-safe error messages (no raw crash output)
- Uses `ANTHROPIC_API_KEY` from server env

## 11) Testing

Configured with:
- `vitest.config.ts`
- `vitest.setup.ts`

Test coverage currently includes:
- Store logic tests (`store/__tests__`)
- Component tests (`components/__tests__`)
- AI client tests (`lib/__tests__`)

Run:

```bash
npm run test
npm run test:coverage
```

Coverage HTML output:
- `coverage/index.html`

## 12) Repo Structure

```text
app/                 Next.js app routes + API routes
components/          UI, feed, match, shared, and layout components
store/               Zustand stores
lib/                 Utilities, API clients, constants, storage helpers
data/                Mock and suggestion datasets
types/               Shared TypeScript interfaces
prisma/              Schema, migration, seed
hooks/               Custom React hooks
styles/              Additional global styles
```

## 13) Architecture Notes

This repository contains two parallel UI layers:
- Primary production path: typed Next.js pages and modern components (`app/*`, `store/*`, `types/*`)
- Legacy/demo path: large JSX prototype modules (`app/kickoff/page.jsx`, `components/NewComponents.jsx`, `lib/mock-data.ts`, legacy pages/components)

Both currently coexist. When extending the app, prefer the typed modern path unless intentionally working on prototype/demo pages.

## 14) Security and Environment Notes

- Keep `.env` out of source control (already ignored in `.gitignore`)
- Do not hardcode API keys in client code
- AI key should stay server-side and be read from `process.env.ANTHROPIC_API_KEY`

## 15) Troubleshooting

- If Prisma client types are missing:
  - Run `npm install` (postinstall runs `prisma generate`)
- If DB is out of sync:
  - Run `npm run db:migrate`
  - Then `npm run db:seed`
- If AI replies fallback:
  - Confirm `ANTHROPIC_API_KEY` is set in `.env`
