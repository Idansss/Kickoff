"use client"

import * as Tabs from '@radix-ui/react-tabs'
import { PlayerMatchLog } from './PlayerMatchLog'
import { PlayerStatsGrid } from './PlayerStatsGrid'

interface PlayerTabsProps {
  playerId: string
}

export function PlayerTabs({ playerId }: PlayerTabsProps) {
  return (
    <Tabs.Root defaultValue="matches" className="w-full">
      <Tabs.List className="mb-4 flex flex-wrap gap-2 border-b pb-2 text-xs">
        <Tabs.Trigger
          value="matches"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Matches
        </Tabs.Trigger>
        <Tabs.Trigger
          value="stats"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Stats
        </Tabs.Trigger>
        <Tabs.Trigger
          value="career"
          className="rounded-full border px-3 py-1 font-medium data-[state=active]:bg-muted"
        >
          Transfers / Career
        </Tabs.Trigger>
      </Tabs.List>

      <div className="space-y-4">
        <Tabs.Content value="matches">
          <PlayerMatchLog playerId={playerId} />
        </Tabs.Content>
        <Tabs.Content value="stats">
          <PlayerStatsGrid playerId={playerId} />
        </Tabs.Content>
        <Tabs.Content value="career">
          <section className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            Transfers and career history will appear here in a later milestone.
          </section>
        </Tabs.Content>
      </div>
    </Tabs.Root>
  )
}

