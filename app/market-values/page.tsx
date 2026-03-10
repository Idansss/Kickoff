'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopPlayersTable } from '@/components/football/market-value/TopPlayersTable'
import { TopClubsTable } from '@/components/football/market-value/TopClubsTable'
import { MoversPanel } from '@/components/football/market-value/MoversPanel'
import { WinnersLosersPanel } from '@/components/football/market-value/WinnersLosersPanel'
import { cn } from '@/lib/utils'

type Tab = 'players' | 'clubs' | 'movers' | 'winners'

const TABS: { key: Tab; label: string }[] = [
  { key: 'players', label: 'Most valuable players' },
  { key: 'clubs', label: 'Most valuable clubs' },
  { key: 'movers', label: 'Biggest movers' },
  { key: 'winners', label: 'Winners & losers' },
]

// Quick-link pills shown below the hero
const QUICK_LINKS = [
  { href: '/free-agents', label: 'Free agents' },
  { href: '/contracts-ending', label: 'Contracts ending' },
  { href: '/agents', label: 'Agent rankings' },
  { href: '/agencies', label: 'Agency rankings' },
  { href: '/players/advanced-search', label: 'Advanced search' },
  { href: '/value-quiz', label: '🎯 Value quiz' },
]

export default function MarketValuesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('players')
  const [positionFilter, setPositionFilter] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('')

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 animate-fade-in-up">
      {/* Hero */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Market values</h1>
        <p className="text-sm text-muted-foreground">
          Real-time squad and player valuations — ranked, tracked, and compared.
        </p>
      </header>

      {/* Quick links */}
      <nav className="flex flex-wrap gap-2">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>

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
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Position
            </label>
            <select
              className="mt-1 h-8 rounded-md border bg-background px-2 text-xs"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="">Any</option>
              <option value="GK">Goalkeeper</option>
              <option value="DF">Defender</option>
              <option value="MF">Midfielder</option>
              <option value="FW">Forward</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Nationality
            </label>
            <input
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
    </main>
  )
}
