"use client"

import * as Tabs from '@radix-ui/react-tabs'
import { StandingsTab } from './tabs/StandingsTab'
import { MatchesTab } from './tabs/MatchesTab'
import { LeadersTab } from './tabs/LeadersTab'
import { NewsTab } from './tabs/NewsTab'
import { CompetitionValueTab } from './tabs/CompetitionValueTab'

interface CompetitionTabsProps {
  competitionId: string
}

export function CompetitionTabs({ competitionId }: CompetitionTabsProps) {
  return (
    <Tabs.Root defaultValue="standings" className="w-full">
      <Tabs.List className="mb-4 flex flex-wrap gap-2 border-b pb-2 text-xs">
        <Tabs.Trigger
          value="standings"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Standings
        </Tabs.Trigger>
        <Tabs.Trigger
          value="matches"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Matches
        </Tabs.Trigger>
        <Tabs.Trigger
          value="leaders"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Leaders
        </Tabs.Trigger>
        <Tabs.Trigger
          value="news"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          News
        </Tabs.Trigger>
        <Tabs.Trigger
          value="value"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Market Values
        </Tabs.Trigger>
      </Tabs.List>

      <div className="space-y-4">
        <Tabs.Content value="standings">
          <StandingsTab competitionId={competitionId} />
        </Tabs.Content>
        <Tabs.Content value="matches">
          <MatchesTab competitionId={competitionId} />
        </Tabs.Content>
        <Tabs.Content value="leaders">
          <LeadersTab competitionId={competitionId} />
        </Tabs.Content>
        <Tabs.Content value="news">
          <NewsTab competitionId={competitionId} />
        </Tabs.Content>
        <Tabs.Content value="value">
          <CompetitionValueTab competitionId={competitionId} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  )
}

