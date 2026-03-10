"use client"

import Link from 'next/link'
import * as Tabs from '@radix-ui/react-tabs'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import type { MatchDTO } from '@/lib/football/providers/types'

type Lineups = MatchDTO['lineups']
type MatchTeam = MatchDTO['match']['homeTeam']

interface MatchLineupsProps {
  lineups: Lineups
  homeTeam: MatchTeam
  awayTeam: MatchTeam
}

function PlayerRow({
  id,
  name,
  position,
  shirtNo,
  inMin,
  outMin,
  rating,
}: {
  id?: string
  name: string
  position?: string | null
  shirtNo?: number | null
  inMin?: number | null
  outMin?: number | null
  rating?: number | null
}) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/60">
      <div className="flex items-center gap-2">
        {shirtNo != null && <span className="w-6 text-center tabular-nums text-muted-foreground">{shirtNo}</span>}
        {id ? (
          <Link href={`/player/${id}`} className="font-medium hover:underline">{name}</Link>
        ) : (
          <span className="font-medium">{name}</span>
        )}
        {position && <span className="text-[11px] uppercase text-muted-foreground">{position}</span>}
      </div>
      <div className="flex items-center gap-2">
        {(inMin != null || outMin != null) && (
          <span className="text-[11px] text-muted-foreground">
            {inMin != null && `↩ ${inMin}'`}
            {outMin != null && (inMin != null ? ` · ↪ ${outMin}'` : `↪ ${outMin}'`)}
          </span>
        )}
        {rating != null && (
          <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-500">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}

function TeamLineupColumn({
  label,
  startingXI,
  bench,
}: {
  label: string
  startingXI: Lineups['home']['startingXI']
  bench: Lineups['home']['bench']
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Starting XI</p>
        <div className="space-y-0.5">
          {startingXI.map((p) => (
            <PlayerRow
              key={p.id}
              id={p.id}
              name={p.name}
              position={p.position}
              shirtNo={p.shirtNo}
              inMin={p.inMin}
              outMin={p.outMin}
              rating={p.rating}
            />
          ))}
          {startingXI.length === 0 && (
            <p className="text-[11px] text-muted-foreground">No lineup data yet.</p>
          )}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Bench</p>
        <div className="space-y-0.5">
          {bench.map((p) => (
            <PlayerRow
              key={p.id}
              id={p.id}
              name={p.name}
              position={p.position}
              shirtNo={p.shirtNo}
              inMin={p.inMin}
              outMin={p.outMin}
              rating={p.rating}
            />
          ))}
          {bench.length === 0 && <p className="text-[11px] text-muted-foreground">No bench data yet.</p>}
        </div>
      </div>
    </div>
  )
}

export function MatchLineups({ lineups, homeTeam, awayTeam }: MatchLineupsProps) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <Tabs.Root defaultValue="home" className="w-full">
        <Tabs.List className="mb-3 flex gap-2">
          <Tabs.Trigger
            value="home"
            className="rounded-full border px-3 py-1 text-xs font-medium data-[state=active]:bg-muted"
          >
            <ClubIdentity name={homeTeam.name} badgeUrl={homeTeam.badgeUrl} size="sm" />
          </Tabs.Trigger>
          <Tabs.Trigger
            value="away"
            className="rounded-full border px-3 py-1 text-xs font-medium data-[state=active]:bg-muted"
          >
            <ClubIdentity name={awayTeam.name} badgeUrl={awayTeam.badgeUrl} size="sm" />
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="home">
          <TeamLineupColumn
            label={`${homeTeam.name} lineup`}
            startingXI={lineups.home.startingXI}
            bench={lineups.home.bench}
          />
        </Tabs.Content>

        <Tabs.Content value="away">
          <TeamLineupColumn
            label={`${awayTeam.name} lineup`}
            startingXI={lineups.away.startingXI}
            bench={lineups.away.bench}
          />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  )
}
