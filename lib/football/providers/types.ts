export type CalendarMatchDTO = {
  id: string
  kickoff: string
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED'
  competition: { id: string; name: string; logoUrl?: string | null }
  homeTeam: { id: string; name: string; badgeUrl?: string | null; score?: number | null }
  awayTeam: { id: string; name: string; badgeUrl?: string | null; score?: number | null }
}

export type MatchEventDTO = {
  id: string
  minute: number | null
  type: string
  teamId: string | null
  teamName?: string | null
  player?: {
    id: string
    name: string
    photoUrl?: string | null
  }
  assist?: {
    id: string
    name?: string | null
  } | null
}

export type MatchLineupPlayerDTO = {
  id: string
  name: string
  position?: string | null
  shirtNo?: number | null
  isStarting: boolean
  inMin?: number | null
  outMin?: number | null
  rating?: number | null
  cards?: unknown
  goals?: number | null
  assists?: number | null
}

export type MatchLineupsDTO = {
  home: {
    startingXI: MatchLineupPlayerDTO[]
    bench: MatchLineupPlayerDTO[]
  }
  away: {
    startingXI: MatchLineupPlayerDTO[]
    bench: MatchLineupPlayerDTO[]
  }
}

export type MatchStatsNormalizedDTO = {
  shotsHome: number | null
  shotsAway: number | null
  shotsOnTargetHome: number | null
  shotsOnTargetAway: number | null
  possessionHome: number | null
  possessionAway: number | null
  passesHome: number | null
  passesAway: number | null
  bigChancesHome: number | null
  bigChancesAway: number | null
  xgHome: number | null
  xgAway: number | null
  xgaHome: number | null
  xgaAway: number | null
}

export type MatchStatsDTO = {
  normalized: MatchStatsNormalizedDTO
  raw: unknown
}

export type MatchDTO = {
  match: CalendarMatchDTO & {
    venue?: string | null
  }
  events: MatchEventDTO[]
  lineups: MatchLineupsDTO
  stats: MatchStatsDTO | null
}

export type TeamOverviewDTO = {
  id: string
  name: string
  badgeUrl?: string | null
  country?: string | null
  coachName?: string | null
  table?: Record<string, unknown> | null
  form?: string[] | null
}

export interface FootballProvider {
  getMatchesByDate(dateISO: string, competitionId?: string | null): Promise<CalendarMatchDTO[]>
  getMatch(id: string): Promise<MatchDTO | null>
  getTeamOverview(teamId: string): Promise<TeamOverviewDTO | null>
}

