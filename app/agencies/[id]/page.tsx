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

interface AgentEntry {
  id: string
  name: string
  country?: string | null
  email?: string | null
  role?: string | null
  since?: string | null
  activeClientCount: number
}

interface PlayerEntry {
  id: string
  name: string
  nationality?: string | null
  position?: string | null
  age?: number | null
  photoUrl?: string | null
  currentTeam?: { id: string; name: string; badgeUrl?: string | null } | null
  agent?: { id: string; name: string } | null
  marketValue?: { raw: number; formatted: string; date: string } | null
  contract?: { endDate: string; status: string } | null
  since?: string | null
}

interface AgencyDetailDTO {
  agency: {
    id: string
    name: string
    country?: string | null
    website?: string | null
  }
  agents: AgentEntry[]
  stats: {
    agentCount: number
    currentClientCount: number
    totalClientValueEur: number
    totalClientValueFormatted?: string | null
  }
  currentClients: PlayerEntry[]
}

async function fetchAgency(id: string): Promise<AgencyDetailDTO | null> {
  try {
    const { db } = await import('@/lib/db')
    const agency = await db.agency.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            agent: {
              include: {
                playerAgents: {
                  where: { OR: [{ endDate: null }, { endDate: { gt: new Date() } }] },
                  select: { id: true },
                },
              },
            },
          },
        },
        playerAgents: {
          include: {
            player: {
              include: {
                currentTeam: { select: { id: true, name: true, badgeUrl: true } },
                marketValues: { orderBy: { date: 'desc' }, take: 1 },
                contracts: { where: { status: 'ACTIVE' }, orderBy: { endDate: 'asc' }, take: 1 },
              },
            },
            agent: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!agency) return null
    const now = new Date()
    const calcAge = (dob: Date | null) => dob ? Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970) : null
    const currentClients = agency.playerAgents
      .filter((pa) => pa.player != null && (pa.endDate == null || pa.endDate > now))
      .map((pa) => {
        const p = pa.player!
        const lv = p.marketValues[0]
        const ac = p.contracts[0]
        return {
          id: p.id, name: p.name, nationality: p.nationality, position: p.position,
          age: calcAge(p.dob ?? null), photoUrl: p.photoUrl, currentTeam: p.currentTeam,
          agent: pa.agent ? { id: pa.agent.id, name: pa.agent.name } : null,
          marketValue: lv ? { raw: lv.valueEur, formatted: `€${(lv.valueEur / 1_000_000).toFixed(1)}m`, date: lv.date } : null,
          contract: ac ? { endDate: ac.endDate, status: ac.status } : null,
          since: pa.startDate,
        }
      })
    currentClients.sort((a, b) => (b.marketValue?.raw ?? 0) - (a.marketValue?.raw ?? 0))
    const totalValueEur = currentClients.reduce((acc, c) => acc + (c.marketValue?.raw ?? 0), 0)
    return {
      agency: { id: agency.id, name: agency.name, country: agency.country, website: agency.website },
      agents: agency.agents.map((m) => ({
        id: m.agent.id, name: m.agent.name, country: m.agent.country, email: m.agent.email,
        role: m.role, since: m.startDate, activeClientCount: m.agent.playerAgents.length,
      })),
      stats: {
        agentCount: agency.agents.length, currentClientCount: currentClients.length,
        totalClientValueEur: totalValueEur,
        totalClientValueFormatted: totalValueEur > 0 ? `€${(totalValueEur / 1_000_000).toFixed(1)}m` : null,
      },
      currentClients,
    }
  } catch { return null }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = await fetchAgency(id)
  if (!data) return { title: 'Agency not found · KICKOFF' }
  return {
    title: `${data.agency.name} · Agency · KICKOFF`,
    description: `${data.agency.name} — ${data.stats.agentCount} agents, ${data.stats.currentClientCount} clients. Portfolio: ${data.stats.totalClientValueFormatted ?? '—'}.`,
  }
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchAgency(id)
  if (!data) notFound()

  const { agency, agents, stats, currentClients } = data

  return (
    <AppLayout>
      <PageShell
        className="animate-fade-in-up"
        title={agency.name}
        description="Agency profile, agent roster, and client portfolio."
        header={
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link href="/agencies" className="hover:underline">
                Agencies
              </Link>
              <span>/</span>
              <span className="text-foreground">{agency.name}</span>
            </nav>
            <MarketHubQuickLinks />
          </div>
        }
      >
        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {agency.country ? (
                  <span className="flex items-center gap-1">
                    <span>🌍</span> {agency.country}
                  </span>
                ) : null}
                {agency.website ? (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <span>🔗</span> {agency.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard value={stats.agentCount} label="Agents" />
              <StatCard value={stats.currentClientCount} label="Clients" />
              <StatCard value={stats.totalClientValueFormatted ?? '—'} label="Portfolio" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">
            Agents ({stats.agentCount})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {agents.map((agent) => {
              const initials = agent.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="group rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-bold text-muted-foreground">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold group-hover:underline">{agent.name}</p>
                          {agent.role ? <Badge variant="secondary">{agent.role}</Badge> : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[agent.country, agent.email].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {agent.activeClientCount} client{agent.activeClientCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
          {agents.length === 0 && (
            <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No agents listed.
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">
            Current clients ({stats.currentClientCount})
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {currentClients.map((p, i) => {
              const contractEndDate = p.contract?.endDate ? new Date(p.contract.endDate) : null
              const now = new Date()
              const monthsLeft = contractEndDate
                ? Math.max(0, Math.round((contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
                : null
              const contractUrgency =
                monthsLeft != null && monthsLeft <= 6
                  ? 'text-red-500'
                  : monthsLeft != null && monthsLeft <= 12
                  ? 'text-amber-500'
                  : 'text-muted-foreground'

              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/player/${p.id}`} className="truncate text-sm font-semibold hover:underline">
                        {p.name}
                      </Link>
                      {p.position ? <Badge variant="secondary">{p.position}</Badge> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {p.nationality ? <span>{p.nationality}</span> : null}
                      {p.age != null ? <span>{p.age} yrs</span> : null}
                      {p.currentTeam ? (
                        <ClubIdentity
                          name={p.currentTeam.name}
                          badgeUrl={p.currentTeam.badgeUrl}
                          href={`/club/${p.currentTeam.id}`}
                          size="xs"
                          textClassName="text-xs text-muted-foreground hover:underline"
                        />
                      ) : null}
                      {p.agent ? (
                        <Link href={`/agents/${p.agent.id}`} className="hover:underline">
                          via {p.agent.name}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">
                      {p.marketValue?.formatted ?? <span className="text-muted-foreground">—</span>}
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
            })}
            {currentClients.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No current clients on record.
              </div>
            )}
          </div>
        </section>
      </PageShell>
    </AppLayout>
  )
}
