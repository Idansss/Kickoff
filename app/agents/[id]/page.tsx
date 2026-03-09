import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ClubIdentity } from '@/components/common/ClubIdentity'

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
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${baseUrl}/api/agents/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()) as AgentDetailDTO
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/player/${player.id}`}
            className="truncate text-sm font-medium hover:underline"
          >
            {player.name}
          </Link>
          {player.position && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {player.position}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
          {player.nationality && <span>{player.nationality}</span>}
          {player.age != null && <span>{player.age} yrs</span>}
          {player.currentTeam && (
            <ClubIdentity
              name={player.currentTeam.name}
              badgeUrl={player.currentTeam.badgeUrl}
              href={`/club/${player.currentTeam.id}`}
              size="xs"
              textClassName="hover:underline"
            />
          )}
        </div>
      </div>

      <div className="shrink-0 text-right text-xs">
        <div className="font-semibold">
          {player.marketValue?.formatted ?? (
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
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/agents" className="hover:underline">
          Agents
        </Link>
        <span>/</span>
        <span className="text-foreground">{agent.name}</span>
      </nav>

      {/* Header */}
      <header className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {agent.country && (
                <span className="flex items-center gap-1">
                  <span>🌍</span> {agent.country}
                </span>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <span>✉️</span> {agent.email}
                </a>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <span>📞</span> {agent.phone}
                </a>
              )}
            </div>

            {agent.agencies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {agent.agencies.map((ag) => (
                  <Link
                    key={ag.id}
                    href={`/agencies/${ag.id}`}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-0.5 text-xs font-medium hover:bg-muted"
                  >
                    {ag.name}
                    {ag.role && (
                      <span className="text-muted-foreground">· {ag.role}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex shrink-0 gap-4 rounded-lg bg-muted/30 px-4 py-3 text-center">
            <div>
              <div className="text-xl font-bold">{stats.currentClientCount}</div>
              <div className="text-[11px] text-muted-foreground">Clients</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-xl font-bold">
                {stats.totalClientValueFormatted ?? '—'}
              </div>
              <div className="text-[11px] text-muted-foreground">Portfolio</div>
            </div>
            {stats.pastClientCount > 0 && (
              <>
                <div className="w-px bg-border" />
                <div>
                  <div className="text-xl font-bold">{stats.pastClientCount}</div>
                  <div className="text-[11px] text-muted-foreground">Past</div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Current clients */}
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

      {/* Past clients */}
      {pastClients.length > 0 && (
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
                  <Link
                    href={`/player/${p.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {p.name}
                  </Link>
                  {p.position && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">
                      {p.position}
                    </span>
                  )}
                </div>
                <div className="text-right text-[11px]">
                  {p.currentTeam && (
                    <ClubIdentity
                      name={p.currentTeam.name}
                      badgeUrl={p.currentTeam.badgeUrl}
                      href={`/club/${p.currentTeam.id}`}
                      size="xs"
                      textClassName="hover:underline"
                    />
                  )}
                  {p.until && (
                    <div>
                      Until{' '}
                      {new Date(p.until).toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
