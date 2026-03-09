import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ClubIdentity } from '@/components/common/ClubIdentity'

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
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${baseUrl}/api/agencies/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()) as AgencyDetailDTO
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
    <div className="flex flex-col items-center rounded-lg bg-muted/30 px-5 py-3 text-center">
      <span className="text-xl font-bold">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
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
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/agencies" className="hover:underline">
          Agencies
        </Link>
        <span>/</span>
        <span className="text-foreground">{agency.name}</span>
      </nav>

      {/* Header card */}
      <header className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{agency.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {agency.country && (
                <span className="flex items-center gap-1">
                  <span>🌍</span> {agency.country}
                </span>
              )}
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  <span>🔗</span> {agency.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            <StatCard value={stats.agentCount} label="Agents" />
            <StatCard value={stats.currentClientCount} label="Clients" />
            <StatCard
              value={stats.totalClientValueFormatted ?? '—'}
              label="Portfolio"
            />
          </div>
        </div>
      </header>

      {/* Agents roster */}
      <section>
        <h2 className="mb-2 text-base font-semibold">
          Agents ({stats.agentCount})
        </h2>
        <div className="divide-y rounded-xl border bg-card">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div>
                <Link
                  href={`/agents/${agent.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {agent.name}
                </Link>
                <div className="mt-0.5 flex gap-x-2 text-[11px] text-muted-foreground">
                  {agent.country && <span>{agent.country}</span>}
                  {agent.role && <span>· {agent.role}</span>}
                  {agent.email && (
                    <a href={`mailto:${agent.email}`} className="hover:underline">
                      {agent.email}
                    </a>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {agent.activeClientCount} client
                {agent.activeClientCount !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No agents listed.
            </div>
          )}
        </div>
      </section>

      {/* Client roster */}
      <section>
        <h2 className="mb-2 text-base font-semibold">
          Current clients ({stats.currentClientCount})
        </h2>
        <div className="divide-y rounded-xl border bg-card">
          {currentClients.map((p, i) => {
            const contractEndDate = p.contract?.endDate
              ? new Date(p.contract.endDate)
              : null
            const now = new Date()
            const monthsLeft = contractEndDate
              ? Math.max(
                  0,
                  Math.round(
                    (contractEndDate.getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24 * 30),
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
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/player/${p.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.position && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {p.position}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                    {p.nationality && <span>{p.nationality}</span>}
                    {p.age != null && <span>{p.age} yrs</span>}
                    {p.currentTeam && (
                      <ClubIdentity
                        name={p.currentTeam.name}
                        badgeUrl={p.currentTeam.badgeUrl}
                        href={`/club/${p.currentTeam.id}`}
                        size="xs"
                        textClassName="hover:underline"
                      />
                    )}
                    {p.agent && (
                      <Link
                        href={`/agents/${p.agent.id}`}
                        className="hover:underline"
                      >
                        via {p.agent.name}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right text-xs">
                  <div className="font-semibold">
                    {p.marketValue?.formatted ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  {contractEndDate && (
                    <div className={contractUrgency}>
                      Exp.{' '}
                      {contractEndDate.toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
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
    </main>
  )
}
