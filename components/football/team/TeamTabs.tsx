"use client"

import * as Tabs from '@radix-ui/react-tabs'
import { TeamNewsTab } from './tabs/TeamNewsTab'
import { TeamMatchesTab } from './tabs/TeamMatchesTab'
import { TeamTableTab } from './tabs/TeamTableTab'
import { TeamStatsTab } from './tabs/TeamStatsTab'
import { TeamTransfersTab } from './tabs/TeamTransfersTab'
import { TeamSquadTab } from './tabs/TeamSquadTab'
import { TeamTrophiesTab } from './tabs/TeamTrophiesTab'
import { TeamValueTab } from './tabs/TeamValueTab'

interface TeamTabsProps {
  teamId: string
}

export function TeamTabs({ teamId }: TeamTabsProps) {
  return (
    <Tabs.Root defaultValue="news" className="w-full">
      <Tabs.List className="mb-4 flex flex-wrap gap-2 border-b pb-2 text-xs">
        <Tabs.Trigger value="news" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">News</Tabs.Trigger>
        <Tabs.Trigger value="matches" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Matches</Tabs.Trigger>
        <Tabs.Trigger value="table" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Table</Tabs.Trigger>
        <Tabs.Trigger value="stats" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Stats</Tabs.Trigger>
        <Tabs.Trigger value="transfers" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Transfers</Tabs.Trigger>
        <Tabs.Trigger value="squad" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Squad</Tabs.Trigger>
        <Tabs.Trigger value="trophies" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Trophies</Tabs.Trigger>
        <Tabs.Trigger value="value" className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted">Squad Value</Tabs.Trigger>
      </Tabs.List>

      <div className="space-y-4">
        <Tabs.Content value="news"><TeamNewsTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="matches"><TeamMatchesTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="table"><TeamTableTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="stats"><TeamStatsTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="transfers"><TeamTransfersTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="squad"><TeamSquadTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="trophies"><TeamTrophiesTab teamId={teamId} /></Tabs.Content>
        <Tabs.Content value="value"><TeamValueTab teamId={teamId} /></Tabs.Content>
      </div>
    </Tabs.Root>
  )
}
