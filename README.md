# KICKOFF

KICKOFF is a football social super-app built with Next.js, React, TypeScript, Zustand, and Prisma.

The app combines:
- Social feed (posts, replies, reposts, polls, bookmarks)
- Live match center (ticker, xG, timeline, momentum, shot map, reminders)
- Chat rooms
- Discovery (players, transfers, standings, trending)
- AI features (FootballGPT Q&A, scout reports, match previews)
- Profile, XP/level/streak/badges, notifications, settings

## 1) Tech Stack

- Framework: Next.js 16 (App Router)
- UI: React 19 + Tailwind CSS + Radix UI primitives
- Language: TypeScript (strict mode)
- State: Zustand + persist middleware
- Data layer: Prisma ORM + SQLite (default local db)
- AI: Anthropic Claude via server-side API routes
- Testing: Vitest + Testing Library
- Analytics: Vercel Analytics

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

Set values:
- `DATABASE_URL` (default SQLite works locally)
- `ANTHROPIC_API_KEY` (required for live AI responses)

### Database

```bash
npm run db:migrate
npm run db:seed
```

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

## 9) AI Integration

Client AI helpers:
- `lib/claudeClient.ts` calls internal API routes only

Server Anthropic wrapper:
- `lib/anthropic.ts`

Behavior:
- Request timeout
- Retry once on failure
- User-safe error messages (no raw crash output)
- Uses `ANTHROPIC_API_KEY` from server env

## 10) Testing

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

## 11) Repo Structure

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

## 12) Architecture Notes

This repository contains two parallel UI layers:
- Primary production path: typed Next.js pages and modern components (`app/*`, `store/*`, `types/*`)
- Legacy/demo path: large JSX prototype modules (`app/kickoff/page.jsx`, `components/NewComponents.jsx`, `lib/mock-data.ts`, legacy pages/components)

Both currently coexist. When extending the app, prefer the typed modern path unless intentionally working on prototype/demo pages.

## 13) Security and Environment Notes

- Keep `.env` out of source control (already ignored in `.gitignore`)
- Do not hardcode API keys in client code
- AI key should stay server-side and be read from `process.env.ANTHROPIC_API_KEY`

## 14) Troubleshooting

- If Prisma client types are missing:
  - Run `npm install` (postinstall runs `prisma generate`)
- If DB is out of sync:
  - Run `npm run db:migrate`
  - Then `npm run db:seed`
- If AI replies fallback:
  - Confirm `ANTHROPIC_API_KEY` is set in `.env`
