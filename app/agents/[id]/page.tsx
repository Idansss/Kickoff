import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AppLayout } from '@/components/app-layout'

export const dynamic = 'force-dynamic'

interface PlayerEntry {
  id: string
  name: string
  nationality?: string | null
  position?: string | null
  age?: number | null
  photoUrl?: string | null
  currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
  marketValue?: { raw: number; formatted: string; date: string } | null
  contract?: { endDate: string; status: string } | null
  since?: string | null
}

interface AgentDetailDTO {
  agent: {
    id: string
    name: string
    country?: string | null
    email?: string | null
    phone?: string | null
    agencies: Array<{
      id: string
      name: string
      country?: string | null
      website?: string | null
      role?: string | null
      since?: string | null
    }>
  }
  stats: {
    currentClientCount: number
    pastClientCount: number
    totalClientValueEur: number
    totalClientValueFormatted?: string | null
  }
  currentClients: PlayerEntry[]
  pastClients: Array<{
    id: string
    name: string
    nationality?: string | null
    position?: string | null
    currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
    until?: string | null
  }>
}

async function fetchAgent(id: string): Promise<AgentDetailDTO | null> {
  try {
    const { db } = await import('@/lib/db')
    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        agencyMemberships: { include: { agency: true } },
        playerAgents: {
          include: {
            player: {
              include: {
                currentTeam: { select: { id: true, name: true, badgeUrl: true } },
                marketValues: { orderBy: { date: 'desc' }, take: 1 },
                contracts: { where: { status: 'ACTIVE' }, orderBy: { endDate: 'asc' }, take: 1 },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    })
    if (!agent) return null
    const now = new Date()
    const calcAge = (dob: Date | null) => dob ? Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970) : null
    const currentClients = agent.playerAgents
      .filter((pa) => pa.player != null && (pa.endDate == null || pa.endDate > now))
      .map((pa) => {
        const p = pa.player!
        const lv = p.marketValues[0]
        const ac = p.contracts[0]
        return {
          id: p.id, name: p.name, nationality: p.nationality, position: p.position,
          age: calcAge(p.dob ?? null), photoUrl: p.photoUrl, currentTeam: p.currentTeam,
          marketValue: lv ? { raw: lv.valueEur, formatted: `€${(lv.valueEur / 1_000_000).toFixed(1)}m`, date: lv.date } : null,
          contract: ac ? { endDate: ac.endDate, status: ac.status } : null,
          since: pa.startDate,
        }
      })
    const pastClients = agent.playerAgents
      .filter((pa) => pa.player != null && pa.endDate != null && pa.endDate <= now)
      .map((pa) => {
        const p = pa.player!
        return { id: p.id, name: p.name, nationality: p.nationality, position: p.position, currentTeam: p.currentTeam, until: pa.endDate }
      })
    const totalValueEur = currentClients.reduce((acc, c) => acc + (c.marketValue?.raw ?? 0), 0)
    return {
      agent: {
        id: agent.id, name: agent.name, country: agent.country, email: agent.email, phone: agent.phone,
        agencies: agent.agencyMemberships.map((m) => ({ id: m.agency.id, name: m.agency.name, country: m.agency.country, website: m.agency.website, role: m.role, since: m.startDate })),
      },
      stats: {
        currentClientCount: currentClients.length, pastClientCount: pastClients.length,
        totalClientValueEur: totalValueEur,
        totalClientValueFormatted: totalValueEur > 0 ? `€${(totalValueEur / 1_000_000).toFixed(1)}m` : null,
      },
      currentClients,
      pastClients,
    }
  } catch { return null }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = await fetchAgent(id)
  if (!data) return { title: 'Agent not found · KICKOFF' }
  return {
    title: `${data.agent.name} · Agent · KICKOFF`,
    description: `Agent profile for ${data.agent.name}. ${data.stats.currentClientCount} current clients with a combined value of ${data.stats.totalClientValueFormatted ?? '—'}.`,
  }
}

function PlayerRow({ player, rank }: { player: PlayerEntry; rank: number }) {
  const contractEndDate = player.contract?.endDate
    ? new Date(player.contract.endDate)
    : null
  const now = new Date()
  const monthsLeft = contractEndDate
    ? Math.max(
        0,
        Math.round(
          (contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      )
    : null

  const contractUrgency =
    monthsLeft != null && monthsLeft <= 6
      ? 'text-red-500'
      : monthsLeft != null && monthsLeft <= 12
      ? 'text-amber-500'
      : 'text-muted-foreground'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/player/${player.id}`} className="truncate text-sm font-semibold hover:underline">
            {player.name}
          </Link>
          {player.position ? <Badge variant="secondary">{player.position}</Badge> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {player.nationality ? <span>{player.nationality}</span> : null}
          {player.age != null ? <span>{player.age} yrs</span> : null}
          {player.currentTeam ? (
            <ClubIdentity
              name={player.currentTeam.name}
              badgeUrl={player.currentTeam.badgeUrl}
              href={`/club/${player.currentTeam.id}`}
              size="xs"
              textClassName="text-xs text-muted-foreground hover:underline"
            />
          ) : (
            <span>Free agent</span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">
          {player.marketValue?.formatted ?? <span className="text-muted-foreground">—</span>}
        </p>
        {contractEndDate ? (
          <p className={cn('text-[11px]', contractUrgency)}>
            Expires {contractEndDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">No contract</p>
        )}
      </div>
    </div>
  )
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchAgent(id)
  if (!data) notFound()

  const { agent, stats, currentClients, pastClients } = data

  return (
    <AppLayout>
      <PageShell
        className="animate-fade-in-up"
        title={agent.name}
        description="Agent profile, portfolio stats, and client roster."
        header={
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link href="/agents" className="hover:underline">
                Agents
              </Link>
              <span>/</span>
              <span className="text-foreground">{agent.name}</span>
            </nav>
            <MarketHubQuickLinks />
          </div>
        }
      >
        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {agent.country ? (
                  <span className="flex items-center gap-1">
                    <span>🌍</span> {agent.country}
                  </span>
                ) : null}
                {agent.email ? (
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-1 hover:underline">
                    <span>✉️</span> {agent.email}
                  </a>
                ) : null}
                {agent.phone ? (
                  <a href={`tel:${agent.phone}`} className="flex items-center gap-1 hover:underline">
                    <span>📞</span> {agent.phone}
                  </a>
                ) : null}
              </div>

              {agent.agencies.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.agencies.map((ag) => (
                    <Link
                      key={ag.id}
                      href={`/agencies/${ag.id}`}
                      className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-0.5 text-xs font-medium hover:bg-muted"
                    >
                      {ag.name}
                      {ag.role ? <span className="text-muted-foreground">· {ag.role}</span> : null}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-3 text-center">
                <div className="text-xl font-bold">{stats.currentClientCount}</div>
                <div className="text-[11px] text-muted-foreground">Clients</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3 text-center">
                <div className="text-xl font-bold">{stats.totalClientValueFormatted ?? '—'}</div>
                <div className="text-[11px] text-muted-foreground">Portfolio</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3 text-center">
                <div className="text-xl font-bold">{stats.pastClientCount}</div>
                <div className="text-[11px] text-muted-foreground">Former</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">
            Current clients ({stats.currentClientCount})
          </h2>
          {currentClients.length > 0 ? (
            <div className="divide-y rounded-xl border bg-card">
              {currentClients.map((p, i) => (
                <PlayerRow key={p.id} player={p} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No current clients on record.
            </div>
          )}
        </section>

        {pastClients.length > 0 ? (
          <section>
            <h2 className="mb-2 text-base font-semibold">
              Former clients ({stats.pastClientCount})
            </h2>
            <div className="divide-y rounded-xl border bg-card">
              {pastClients.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Link href={`/player/${p.id}`} className="font-medium text-foreground hover:underline">
                      {p.name}
                    </Link>
                    {p.position ? <Badge variant="secondary">{p.position}</Badge> : null}
                  </div>
                  <div className="text-right text-[11px]">
                    {p.currentTeam ? (
                      <ClubIdentity
                        name={p.currentTeam.name}
                        badgeUrl={p.currentTeam.badgeUrl}
                        href={`/club/${p.currentTeam.id}`}
                        size="xs"
                        textClassName="hover:underline"
                      />
                    ) : null}
                    {p.until ? (
                      <div>
                        Until {new Date(p.until).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </PageShell>
    </AppLayout>
  )
}
