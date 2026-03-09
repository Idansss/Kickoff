'use client'

import Link from 'next/link'
import { memo, useCallback, useMemo, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { getScoutReport } from '@/lib/claudeClient'
import { cn } from '@/lib/utils'
import {
  mockPlayers,
  mockStandings,
  mockTransfers,
  mockLaLigaStandings,
  mockSerieAStandings,
  mockBundesligaStandings,
  mockLigue1Standings,
} from '@/data/mockData'
import type { Standing } from '@/types'
import { getClubHrefByName, getPlayerHrefByName } from '@/lib/entityLinks'
import type { Player, Transfer } from '@/types'

const TRENDING_HASHTAGS = [
  '#UCLFinal',
  '#Haaland',
  '#Bellingham',
  '#TransferDeadline',
  '#ElClasico',
  '#PremierLeague',
] as const

const LEAGUES: { key: 'premier-league' | 'la-liga' | 'serie-a' | 'bundesliga' | 'ligue-1'; label: string; rows: Standing[] }[] = [
  { key: 'premier-league', label: 'Premier League', rows: mockStandings },
  { key: 'la-liga', label: 'La Liga', rows: mockLaLigaStandings },
  { key: 'serie-a', label: 'Serie A', rows: mockSerieAStandings },
  { key: 'bundesliga', label: 'Bundesliga', rows: mockBundesligaStandings },
  { key: 'ligue-1', label: 'Ligue 1', rows: mockLigue1Standings },
]

interface PlayerRowProps {
  player: Player
}

const PlayerRow = memo(function PlayerRow({ player }: PlayerRowProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [scoutReport, setScoutReport] = useState<string | null>(null)
  const [loadingScout, setLoadingScout] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = useMemo(
    () =>
      player.name
        .split(' ')
        .map((name) => name[0])
        .join('')
        .slice(0, 2),
    [player.name]
  )

  const formBars = useMemo(
    () =>
      player.formRatings.map((rating, index) => ({
        key: `${player.id}-form-${index}`,
        height: `${(rating / 10) * 100}%`,
        value: rating,
      })),
    [player.formRatings, player.id]
  )

  const handleToggleExpanded = useCallback((): void => {
    setExpanded((value) => !value)
  }, [])

  const fetchScoutReport = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()
      if (scoutReport !== null || loadingScout) return

      setLoadingScout(true)
      setError(null)
      try {
        const report = await getScoutReport(player.name, player.club)
        setScoutReport(report)
      } catch {
        setError("Couldn't connect. Try again.")
      } finally {
        setLoadingScout(false)
      }
    },
    [loadingScout, player.club, player.name, scoutReport]
  )

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={handleToggleExpanded}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: player.avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {getPlayerHrefByName(player.name) ? (
            <Link
              href={getPlayerHrefByName(player.name)!}
              className="font-semibold text-foreground hover:text-green-500 transition-colors"
            >
              {player.name}
            </Link>
          ) : (
            <div className="font-semibold text-foreground">{player.name}</div>
          )}
          <div className="text-xs text-muted-foreground">
            {getClubHrefByName(player.club) ? (
              <Link
                href={getClubHrefByName(player.club)!}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {player.club}
              </Link>
            ) : (
              player.club
            )}{' '}
            · {player.position} · {player.flag} {player.nationality}
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-foreground">{player.goals}</span>
          <span className="text-muted-foreground text-sm ml-1">goals</span>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border p-4 bg-muted/20 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Form (last 8)</p>
            <div className="flex gap-1 h-6 items-end">
              {formBars.map((bar) => (
                <div
                  key={bar.key}
                  className={cn(
                    'flex-1 min-w-0 rounded-t',
                    bar.value >= 8.5 ? 'bg-green-500/80' : bar.value >= 7.5 ? 'bg-yellow-500/70' : 'bg-red-500/70'
                  )}
                  style={{ height: bar.height }}
                  title={`${bar.value}`}
                />
              ))}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={fetchScoutReport}
            disabled={loadingScout}
          >
            {loadingScout ? 'Loading...' : 'Scout Report'}
          </Button>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {scoutReport ? (
            <div className="rounded-lg border border-border bg-background p-3 text-sm text-foreground whitespace-pre-wrap">
              {scoutReport}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})

interface TransferCardProps {
  transfer: Transfer
}

const TransferCard = memo(function TransferCard({ transfer }: TransferCardProps): React.JSX.Element {
  const playerHref = getPlayerHrefByName(transfer.playerName)
  const fromHref = getClubHrefByName(transfer.from)
  const toHref = getClubHrefByName(transfer.to)

  return (
    <li className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30">
      <div>
        {playerHref ? (
          <Link
            href={playerHref}
            className="font-medium text-foreground hover:text-green-500 transition-colors"
          >
            {transfer.playerName}
          </Link>
        ) : (
          <span className="font-medium">{transfer.playerName}</span>
        )}
        <span className="text-muted-foreground text-sm ml-2">
          {fromHref ? (
            <Link
              href={fromHref}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {transfer.from}
            </Link>
          ) : (
            transfer.from
          )}{' '}
          →{' '}
          {toHref ? (
            <Link
              href={toHref}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {transfer.to}
            </Link>
          ) : (
            transfer.to
          )}
        </span>
        {transfer.isHot ? (
          <span className="ml-2 text-xs bg-red-500/20 text-red-600 rounded px-1.5 py-0.5">Hot</span>
        ) : null}
      </div>
      <span className="font-semibold text-sm">{transfer.fee}</span>
    </li>
  )
})

function TransfersSection(): React.JSX.Element {
  const [tab, setTab] = useState<'confirmed' | 'rumours'>('confirmed')
  const { confirmed, rumours } = useMemo(
    () => ({
      confirmed: mockTransfers.filter((transfer) => transfer.status === 'confirmed'),
      rumours: mockTransfers.filter((transfer) => transfer.status === 'rumour'),
    }),
    []
  )

  const activeTransfers = tab === 'confirmed' ? confirmed : rumours

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('confirmed')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'confirmed' ? 'bg-green-500 text-white' : 'border border-border hover:bg-muted'
          )}
          aria-label="Show confirmed transfers"
        >
          Confirmed
        </button>
        <button
          type="button"
          onClick={() => setTab('rumours')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'rumours' ? 'bg-green-500 text-white' : 'border border-border hover:bg-muted'
          )}
          aria-label="Show transfer rumours"
        >
          Rumours
        </button>
      </div>
      <ul className="space-y-2">
        {activeTransfers.map((transfer) => (
          <TransferCard key={transfer.id} transfer={transfer} />
        ))}
      </ul>
    </div>
  )
}

function LeagueTabs(): React.JSX.Element {
  const [active, setActive] = useState<'premier-league' | 'la-liga' | 'serie-a' | 'bundesliga' | 'ligue-1'>('premier-league')
  const league = LEAGUES.find((l) => l.key === active) ?? LEAGUES[0]

  return (
    <>
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-0.5 text-xs">
        {LEAGUES.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setActive(l.key)}
            className={cn(
              'px-3 py-1 rounded-full font-medium transition-colors',
              active === l.key ? 'bg-green-500 text-white' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-2 px-3 font-medium">#</th>
              <th className="text-left py-2 px-3 font-medium">Club</th>
              <th className="text-center py-2 px-2 font-medium">P</th>
              <th className="text-center py-2 px-2 font-medium">W</th>
              <th className="text-center py-2 px-2 font-medium">D</th>
              <th className="text-center py-2 px-2 font-medium">L</th>
              <th className="text-center py-2 px-2 font-medium">GD</th>
              <th className="text-right py-2 px-3 font-medium">Pts</th>
              <th className="text-left py-2 px-2 font-medium">Form</th>
            </tr>
          </thead>
          <tbody>
            {league.rows.map((row) => {
              const clubHref = getClubHrefByName(row.club)

              return (
                <tr key={`${league.key}-${row.pos}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-2 px-3 font-medium">{row.pos}</td>
                  <td className="py-2 px-3">
                    {clubHref ? (
                      <Link href={clubHref} className="hover:text-green-500 transition-colors">
                        {row.club}
                      </Link>
                    ) : (
                      row.club
                    )}
                  </td>
                  <td className="text-center py-2 px-2">{row.played}</td>
                  <td className="text-center py-2 px-2">{row.won}</td>
                  <td className="text-center py-2 px-2">{row.drawn}</td>
                  <td className="text-center py-2 px-2">{row.lost}</td>
                  <td className="text-center py-2 px-2">{row.gd}</td>
                  <td className="text-right py-2 px-3 font-semibold">{row.points}</td>
                  <td className="py-2 px-2 flex gap-0.5">
                    {row.form.map((formResult, index) => (
                      <span
                        key={`${row.club}-form-${index}`}
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                          formResult === 'W' && 'bg-green-500 text-white',
                          formResult === 'D' && 'bg-muted text-muted-foreground',
                          formResult === 'L' && 'bg-red-500 text-white'
                        )}
                      >
                        {formResult}
                      </span>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function DiscoveryPage(): React.JSX.Element {
  const [loading] = useState(false)

  const topPlayers = useMemo(
    () => [...mockPlayers].sort((left, right) => right.goals - left.goals),
    []
  )

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold">Discovery</h1>
          <p className="text-sm text-muted-foreground">Find players and clubs to follow</p>
        </div>

        <div className="p-4 sm:p-6 space-y-12">
          <section>
            <h2 className="text-lg font-bold mb-4">Trending</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {TRENDING_HASHTAGS.map((tag) => (
                <span
                  key={tag}
                  className="flex-shrink-0 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-green-600 hover:border-green-500/50 cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-6">Top Players</h2>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((index) => (
                  <SkeletonLoader key={index} variant="player" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topPlayers.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </div>
            )}
          </section>

          {/* Market value quick-access section */}
          <section>
            <h2 className="text-lg font-bold mb-3">Market &amp; transfer hub</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { href: '/market-values', label: '💰 Most valuable', sub: 'players & clubs' },
                { href: '/free-agents', label: '🆓 Free agents', sub: 'unattached players' },
                { href: '/contracts-ending', label: '📅 Contracts ending', sub: 'expiring deals' },
                { href: '/agents', label: '🤝 Agents', sub: 'portfolio rankings' },
                { href: '/agencies', label: '🏢 Agencies', sub: 'by squad value' },
                { href: '/players/advanced-search', label: '🔍 Advanced search', sub: 'filter players' },
              ].map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="flex flex-col rounded-xl border bg-card px-3 py-3 transition-colors hover:bg-muted/50 gap-0.5"
                >
                  <span className="text-sm font-semibold">{card.label}</span>
                  <span className="text-[11px] text-muted-foreground">{card.sub}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4">Transfers</h2>
            <TransfersSection />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">League tables</h2>
            </div>
            <LeagueTabs />
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
