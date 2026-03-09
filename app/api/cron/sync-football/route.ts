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
const APF_KEY = process.env.API_FOOTBALL_KEY
const APF_BASE = 'https://v3.football.api-sports.io'

// Top clubs by API-Football team ID (Premier League + top European)
const TOP_CLUB_IDS = [
  33, 34, 40, 41, 42, 45, 47, 48, 49, 50, // Man Utd, Newcastle, Liverpool, Southampton, Arsenal, Everton, Spurs, West Ham, Chelsea, Man City
  51, 52, 66,                              // Brighton, Crystal Palace, Aston Villa
  529, 530, 541,                           // Barcelona, Atletico, Real Madrid
  157, 168,                                // Bayern, Bayer Leverkusen
  489, 496, 505,                           // AC Milan, Juventus, Inter
  85,                                      // PSG
]

async function apfFetch(path: string) {
  if (!APF_KEY) throw new Error('API_FOOTBALL_KEY not set')
  const res = await fetch(`${APF_BASE}${path}`, {
    headers: { 'x-apisports-key': APF_KEY },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`api-football ${res.status}: ${path}`)
  return res.json()
}

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

interface ApfTransferEntry {
  player: { id: number; name: string }
  update: string
  transfers: Array<{
    date: string
    type: string
    teams: {
      in: { id: number; name: string }
      out: { id: number; name: string }
    }
    fee: { amount: number | null; currency: string } | null
  }>
}

async function syncTransfers(): Promise<number> {
  if (!APF_KEY) return 0

  // Only sync once per 20 hours to respect the 100 req/day free tier
  const recentSync = await db.transfer.findFirst({
    where: { providerKey: { startsWith: 'apf_' }, createdAt: { gte: new Date(Date.now() - 20 * 3600 * 1000) } },
  })
  if (recentSync) return -1 // already synced recently

  const currentYear = new Date().getFullYear()
  const season = new Date().getMonth() >= 6 ? currentYear : currentYear - 1

  let synced = 0

  for (const teamId of TOP_CLUB_IDS) {
    let data: { response: ApfTransferEntry[] }
    try {
      data = await apfFetch(`/transfers?team=${teamId}&season=${season}`)
    } catch {
      continue
    }

    for (const entry of data.response ?? []) {
      const playerKey = `apf_${entry.player.id}`

      // Upsert player
      const player = await db.player.upsert({
        where: { providerKey: playerKey },
        create: { providerKey: playerKey, name: entry.player.name },
        update: { name: entry.player.name },
      })

      for (const t of entry.transfers) {
        const transferKey = `apf_${entry.player.id}_${t.date}_${t.teams.in.id}`

        // Upsert from team
        const fromTeamKey = `apf_${t.teams.out.id}`
        const fromTeam = await db.team.upsert({
          where: { providerKey: fromTeamKey },
          create: { providerKey: fromTeamKey, name: t.teams.out.name },
          update: { name: t.teams.out.name },
        })

        // Upsert to team
        const toTeamKey = `apf_${t.teams.in.id}`
        const toTeam = await db.team.upsert({
          where: { providerKey: toTeamKey },
          create: { providerKey: toTeamKey, name: t.teams.in.name },
          update: { name: t.teams.in.name },
        })

        // Map type
        const lowerType = t.type?.toLowerCase() ?? ''
        const type = lowerType === 'loan' ? 'loan'
          : lowerType === 'free' || lowerType === 'n/a' || t.fee?.amount ? 'done'
          : 'done'

        // Format fee
        let fee: string | null = null
        if (t.fee?.amount) {
          const amt = t.fee.amount
          fee = amt >= 1000 ? `${t.fee.currency}${(amt / 1000).toFixed(1)}B`
            : `${t.fee.currency}${amt}M`
        } else if (lowerType === 'free') {
          fee = 'Free'
        } else if (lowerType === 'loan') {
          fee = 'Loan'
        }

        await db.transfer.upsert({
          where: { providerKey: transferKey },
          create: {
            providerKey: transferKey,
            playerId: player.id,
            fromTeamId: fromTeam.id,
            toTeamId: toTeam.id,
            type,
            fee,
            date: t.date ? new Date(t.date) : null,
            metaJson: JSON.stringify({ source: 'API-Football' }),
          },
          update: { type, fee },
        })
        synced++
      }
    }
  }

  return synced
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
    const [competitionCount, matchCount, transferCount] = await Promise.all([
      syncCompetitions(),
      syncMatches(),
      syncTransfers(),
    ])

    return NextResponse.json({
      ok: true,
      synced: {
        competitions: competitionCount,
        matches: matchCount,
        transfers: transferCount === -1 ? 'skipped (synced recently)' : transferCount,
      },
      at: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
