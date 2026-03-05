import { startOfDay, endOfDay } from 'date-fns'
import { db } from '@/lib/db'
import type {
  CalendarMatchDTO,
  FootballProvider,
  MatchDTO,
  MatchLineupPlayerDTO,
  MatchLineupsDTO,
  MatchStatsDTO,
  MatchStatsNormalizedDTO,
  TeamOverviewDTO,
} from './types'

export const mockProvider: FootballProvider = {
  async getMatchesByDate(dateISO, competitionId) {
    const date = new Date(dateISO)
    const from = startOfDay(date)
    const to = endOfDay(date)

    const matches = await db.match.findMany({
      where: {
        kickoff: { gte: from, lte: to },
        ...(competitionId ? { competitionId } : {}),
      },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { kickoff: 'asc' },
    })

    return matches.map<CalendarMatchDTO>((m) => ({
      id: m.id,
      kickoff: m.kickoff.toISOString(),
      status: m.status,
      competition: {
        id: m.competitionId ?? '',
        name: m.competition?.name ?? 'Unknown competition',
        logoUrl: m.competition?.logoUrl,
      },
      homeTeam: {
        id: m.homeTeamId,
        name: m.homeTeam.name,
        badgeUrl: m.homeTeam.badgeUrl,
        score: m.homeScore,
      },
      awayTeam: {
        id: m.awayTeamId,
        name: m.awayTeam.name,
        badgeUrl: m.awayTeam.badgeUrl,
        score: m.awayScore,
      },
    }))
  },

  async getMatch(id) {
    const m = await db.match.findUnique({
      where: { id },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        events: {
          include: {
            team: true,
            player: true,
          },
        },
        lineups: {
          include: {
            player: true,
            team: true,
          },
        },
      },
    })
    if (!m) return null

    const matchCore: CalendarMatchDTO & { venue?: string | null } = {
      id: m.id,
      kickoff: m.kickoff.toISOString(),
      status: m.status,
      competition: {
        id: m.competitionId ?? '',
        name: m.competition?.name ?? 'Unknown competition',
        logoUrl: m.competition?.logoUrl,
      },
      homeTeam: {
        id: m.homeTeamId,
        name: m.homeTeam.name,
        badgeUrl: m.homeTeam.badgeUrl,
        score: m.homeScore,
      },
      awayTeam: {
        id: m.awayTeamId,
        name: m.awayTeam.name,
        badgeUrl: m.awayTeam.badgeUrl,
        score: m.awayScore,
      },
      venue: m.venue,
    }

    const events = m.events
      .slice()
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
      .map((e) => ({
        id: e.id,
        minute: e.minute,
        type: e.type,
        teamId: e.teamId ?? null,
        teamName: e.team?.name ?? null,
        player: e.player
          ? {
              id: e.player.id,
              name: e.player.name,
              photoUrl: e.player.photoUrl,
            }
          : undefined,
        assist: e.assistId
          ? {
              id: e.assistId,
              name: null,
            }
          : null,
      }))

    const emptySide = (): { startingXI: MatchLineupPlayerDTO[]; bench: MatchLineupPlayerDTO[] } => ({
      startingXI: [],
      bench: [],
    })

    const lineups: MatchLineupsDTO = {
      home: emptySide(),
      away: emptySide(),
    }

    for (const l of m.lineups) {
      const side = l.teamId === m.homeTeamId ? 'home' : 'away'
      const container = lineups[side]

      const goalsAssists = (l.g_aJson as { goals?: number; assists?: number } | null) ?? null

      const playerEntry: MatchLineupPlayerDTO = {
        id: l.playerId,
        name: l.player.name,
        position: l.player.position,
        shirtNo: null,
        isStarting: l.isStarting,
        inMin: l.inMin,
        outMin: l.outMin,
        rating: l.rating,
        cards: l.cardsJson ?? undefined,
        goals: goalsAssists?.goals ?? null,
        assists: goalsAssists?.assists ?? null,
      }

      if (l.isStarting) {
        container.startingXI.push(playerEntry)
      } else {
        container.bench.push(playerEntry)
      }
    }

    const rawStats = m.statsJson as Record<string, any> | null
    const normalized: MatchStatsNormalizedDTO = {
      shotsHome: rawStats?.shots?.home ?? null,
      shotsAway: rawStats?.shots?.away ?? null,
      shotsOnTargetHome: rawStats?.shotsOnTarget?.home ?? null,
      shotsOnTargetAway: rawStats?.shotsOnTarget?.away ?? null,
      possessionHome: rawStats?.possession?.home ?? null,
      possessionAway: rawStats?.possession?.away ?? null,
      passesHome: rawStats?.passes?.home ?? null,
      passesAway: rawStats?.passes?.away ?? null,
      bigChancesHome: rawStats?.bigChances?.home ?? null,
      bigChancesAway: rawStats?.bigChances?.away ?? null,
      xgHome: rawStats?.xg?.home ?? null,
      xgAway: rawStats?.xg?.away ?? null,
      xgaHome: rawStats?.xga?.home ?? null,
      xgaAway: rawStats?.xga?.away ?? null,
    }

    const stats: MatchStatsDTO | null = {
      normalized,
      raw: rawStats,
    }

    const match: MatchDTO = {
      match: matchCore,
      events,
      lineups,
      stats,
    }

    return match
  },

  async getTeamOverview(teamId) {
    const team = await db.team.findUnique({
      where: { id: teamId },
    })
    if (!team) return null

    const overview: TeamOverviewDTO = {
      id: team.id,
      name: team.name,
      badgeUrl: team.badgeUrl,
      country: team.country,
      coachName: team.coachName ?? undefined,
      table: null,
      form: null,
    }

    return overview
  },
}

