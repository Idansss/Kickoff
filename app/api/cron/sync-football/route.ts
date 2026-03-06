import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Cron endpoint to sync football data from football-data.org.
 * Called by Vercel Cron (daily on Hobby; use external scheduler for more frequent runs).
 *
 * Configure in vercel.json (Hobby: once per day only, e.g. 0 6 * * * = 6:00 UTC):
 * {
 *   "crons": [
 *     { "path": "/api/cron/sync-football", "schedule": "0 6 * * *" }
 *   ]
 * }
 *
 * Requires: FOOTBALL_DATA_API_KEY env var.
 * See: https://www.football-data.org/documentation/quickstart
 */

const BASE = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_API_KEY

// Authorize cron requests via CRON_SECRET header
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // open in dev
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function apiFetch(path: string) {
  if (!API_KEY) throw new Error('FOOTBALL_DATA_API_KEY not set')
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${path}`)
  return res.json()
}

async function syncCompetitions() {
  const data = await apiFetch('/competitions?plan=TIER_ONE')
  const comps: Array<{ id: number; name: string; code: string; area: { name: string }; type: string }> =
    data.competitions ?? []

  for (const c of comps) {
    await db.competition.upsert({
      where: { providerKey: String(c.id) },
      create: {
        providerKey: String(c.id),
        name: c.name,
        country: c.area?.name,
        type: c.type,
      },
      update: {
        name: c.name,
        country: c.area?.name,
        type: c.type,
      },
    })
  }
  return comps.length
}

async function syncMatches() {
  // Fetch matches scheduled/live in the next 7 days
  const today = new Date().toISOString().slice(0, 10)
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const data = await apiFetch(`/matches?dateFrom=${today}&dateTo=${nextWeek}&competitions=PL,CL,PD,SA,BL1,FL1`)
  const matches: Array<{
    id: number
    status: string
    utcDate: string
    homeTeam: { id: number; name: string; crest: string; shortName: string }
    awayTeam: { id: number; name: string; crest: string; shortName: string }
    score: { fullTime: { home: number | null; away: number | null } }
    competition: { id: number; name: string; code: string }
    venue?: string
  }> = data.matches ?? []

  let upserted = 0
  for (const m of matches) {
    // Upsert teams
    await db.team.upsert({
      where: { providerKey: String(m.homeTeam.id) },
      create: { providerKey: String(m.homeTeam.id), name: m.homeTeam.name, badgeUrl: m.homeTeam.crest },
      update: { name: m.homeTeam.name, badgeUrl: m.homeTeam.crest },
    })
    await db.team.upsert({
      where: { providerKey: String(m.awayTeam.id) },
      create: { providerKey: String(m.awayTeam.id), name: m.awayTeam.name, badgeUrl: m.awayTeam.crest },
      update: { name: m.awayTeam.name, badgeUrl: m.awayTeam.crest },
    })

    // Upsert competition
    await db.competition.upsert({
      where: { providerKey: String(m.competition.id) },
      create: { providerKey: String(m.competition.id), name: m.competition.name },
      update: { name: m.competition.name },
    })

    const [homeTeam, awayTeam, competition] = await Promise.all([
      db.team.findUnique({ where: { providerKey: String(m.homeTeam.id) } }),
      db.team.findUnique({ where: { providerKey: String(m.awayTeam.id) } }),
      db.competition.findUnique({ where: { providerKey: String(m.competition.id) } }),
    ])

    if (!homeTeam || !awayTeam || !competition) continue

    const statusMap: Record<string, string> = {
      SCHEDULED: 'SCHEDULED', TIMED: 'SCHEDULED',
      IN_PLAY: 'LIVE', PAUSED: 'LIVE',
      FINISHED: 'FINISHED', AWARDED: 'FINISHED',
      POSTPONED: 'POSTPONED', CANCELLED: 'CANCELLED',
    }

    await db.match.upsert({
      where: { providerKey: String(m.id) },
      create: {
        providerKey: String(m.id),
        kickoff: new Date(m.utcDate),
        status: (statusMap[m.status] ?? 'SCHEDULED') as 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED',
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        competitionId: competition.id,
        homeScore: m.score.fullTime.home ?? 0,
        awayScore: m.score.fullTime.away ?? 0,
        venue: m.venue,
      },
      update: {
        status: (statusMap[m.status] ?? 'SCHEDULED') as 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED',
        homeScore: m.score.fullTime.home ?? 0,
        awayScore: m.score.fullTime.away ?? 0,
        kickoff: new Date(m.utcDate),
      },
    })
    upserted++
  }
  return upserted
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!API_KEY) {
    return NextResponse.json({
      ok: false,
      message: 'FOOTBALL_DATA_API_KEY not set. Add it to your environment variables.',
    })
  }

  try {
    const [competitionCount, matchCount] = await Promise.all([
      syncCompetitions(),
      syncMatches(),
    ])

    return NextResponse.json({
      ok: true,
      synced: { competitions: competitionCount, matches: matchCount },
      at: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
