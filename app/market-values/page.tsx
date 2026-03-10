'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopPlayersTable } from '@/components/football/market-value/TopPlayersTable'
import { TopClubsTable } from '@/components/football/market-value/TopClubsTable'
import { MoversPanel } from '@/components/football/market-value/MoversPanel'
import { WinnersLosersPanel } from '@/components/football/market-value/WinnersLosersPanel'
import { cn } from '@/lib/utils'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { AppLayout } from '@/components/app-layout'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

type Tab = 'players' | 'clubs' | 'movers' | 'winners'

const TABS: { key: Tab; label: string }[] = [
  { key: 'players', label: 'Most valuable players' },
  { key: 'clubs', label: 'Most valuable clubs' },
  { key: 'movers', label: 'Biggest movers' },
  { key: 'winners', label: 'Winners & losers' },
]

export default function MarketValuesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('players')
  const [positionFilter, setPositionFilter] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('')

  return (
    <AppLayout>
      <PageShell
        className="animate-fade-in-up"
        title="Market values"
        description="Real-time squad and player valuations — ranked, tracked, and compared."
        header={
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <MarketHubQuickLinks />
              <Link
                href="/value-quiz"
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                🎯 Value quiz
              </Link>
            </div>
          </div>
        }
      >
        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                activeTab === t.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Player filters (only when players tab is active) */}
        {activeTab === 'players' && (
          <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3">
            <div>
              <label
                htmlFor="mv-position"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Position
              </label>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="GK">Goalkeeper</SelectItem>
                  <SelectItem value="DF">Defender</SelectItem>
                  <SelectItem value="MF">Midfielder</SelectItem>
                  <SelectItem value="FW">Forward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="mv-nationality"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Nationality
              </label>
              <input
                id="mv-nationality"
                className="mt-1 h-8 rounded-md border bg-background px-2 text-xs"
                placeholder="England, Brazil…"
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
              />
            </div>
            {(positionFilter || nationalityFilter) && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => { setPositionFilter(''); setNationalityFilter('') }}
                  className="mb-0.5 text-[11px] font-medium text-primary hover:underline"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'players' && (
          <TopPlayersTable
            position={positionFilter || undefined}
            nationality={nationalityFilter || undefined}
          />
        )}
        {activeTab === 'clubs' && <TopClubsTable />}
        {activeTab === 'winners' && <WinnersLosersPanel />}
        {activeTab === 'movers' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-semibold">Player movers</h2>
              <MoversPanel />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                See individual histories on player &amp; club pages
              </h2>
              <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
                <p>
                  Navigate to any{' '}
                  <Link href="/players/advanced-search" className="text-primary hover:underline">
                    player
                  </Link>{' '}
                  or{' '}
                  <Link href="/discovery" className="text-primary hover:underline">
                    club
                  </Link>{' '}
                  profile to see their full value history chart and trend analysis.
                </p>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </AppLayout>
  )
}
