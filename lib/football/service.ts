import type { CalendarMatchDTO, MatchDTO, TeamOverviewDTO } from './providers/types'
import type { FootballProvider } from './providers/types'
import { mockProvider } from './providers/mockProvider'

const provider: FootballProvider = mockProvider

export const footballService = {
  matchesByDate(dateISO: string, competitionId?: string | null): Promise<CalendarMatchDTO[]> {
    return provider.getMatchesByDate(dateISO, competitionId)
  },
  match(id: string): Promise<MatchDTO | null> {
    return provider.getMatch(id)
  },
  teamOverview(teamId: string): Promise<TeamOverviewDTO | null> {
    return provider.getTeamOverview(teamId)
  },
}

