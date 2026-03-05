import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { FollowButton } from '@/components/common/FollowButton'

type FollowTab = 'teams' | 'players' | 'matches' | 'competitions'

interface FollowData {
  teams: { id: string; name: string; badgeUrl?: string | null }[]
  players: { id: string; name: string; photoUrl?: string | null }[]
  matches: {
    id: string
    kickoff: string
    competitionName: string | null
    homeTeamName: string
    awayTeamName: string
  }[]
  competitions: { id: string; name: string; logoUrl?: string | null }[]
}

async function fetchFollowData(): Promise<FollowData> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/follow`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    return { teams: [], players: [], matches: [], competitions: [] }
  }

  const json = (await res.json()) as {
    teams?: { id: string; name: string; badgeUrl?: string | null }[]
    players?: { id: string; name: string; photoUrl?: string | null }[]
    matches?: {
      id: string
      kickoff: string
      competitionName: string | null
      homeTeamName: string
      awayTeamName: string
    }[]
    competitions?: { id: string; name: string; logoUrl?: string | null }[]
  }

  return {
    teams: json.teams ?? [],
    players: json.players ?? [],
    matches: json.matches ?? [],
    competitions: json.competitions ?? [],
  }
}

export const metadata = {
  title: 'Following - KICKOFF',
}

export default async function FollowingPage() {
  const data = await fetchFollowData()

  const tabs: { id: FollowTab; label: string; count: number }[] = [
    { id: 'teams', label: 'Teams', count: data.teams.length },
    { id: 'players', label: 'Players', count: data.players.length },
    { id: 'matches', label: 'Matches', count: data.matches.length },
    { id: 'competitions', label: 'Competitions', count: data.competitions.length },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Following</h1>
            <p className="text-sm text-muted-foreground">
              Manage the teams, players, matches, and competitions you follow.
            </p>
          </div>
        </header>

        <div className="rounded-xl border bg-card">
          <div className="flex border-b text-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="flex-1 border-b-2 border-transparent px-4 py-2 font-medium text-muted-foreground data-[active=true]:border-emerald-500 data-[active=true]:text-foreground"
                data-active={tab.id === 'teams'}
              >
                {tab.label}
                <span className="ml-1 text-xs text-muted-foreground">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="p-4 space-y-6">
            <section aria-label="Teams">
              {data.teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">You&apos;re not following any teams yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.teams.map((team) => (
                    <article
                      key={team.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                    >
                      <Link href={`/club/${team.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card">
                          {team.badgeUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={team.badgeUrl}
                              alt={team.name}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <span className="text-sm font-semibold">{team.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{team.name}</div>
                          <div className="text-xs text-muted-foreground">Club</div>
                        </div>
                      </Link>
                      <FollowButton entityType="TEAM" entityId={team.id} />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section aria-label="Players">
              {data.players.length === 0 ? (
                <p className="text-sm text-muted-foreground">You&apos;re not following any players yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.players.map((player) => (
                    <article
                      key={player.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                    >
                      <Link href={`/player/${player.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-card">
                          {player.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold">{player.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">Player</div>
                        </div>
                      </Link>
                      <FollowButton entityType="PLAYER" entityId={player.id} />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section aria-label="Matches">
              {data.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">You&apos;re not following any matches yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.matches.map((match) => {
                    const kickoff = new Date(match.kickoff)
                    const label = `${kickoff.toLocaleDateString()} · ${kickoff.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                    return (
                      <article
                        key={match.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                      >
                        <Link href={`/match/${match.id}`} className="flex flex-col gap-0.5">
                          <div className="text-sm font-medium">
                            {match.homeTeamName} vs {match.awayTeamName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.competitionName ?? 'Match'}
                            <span className="mx-1.5">·</span>
                            {label}
                          </div>
                        </Link>
                        <FollowButton entityType="MATCH" entityId={match.id} />
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section aria-label="Competitions">
              {data.competitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You&apos;re not following any competitions yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.competitions.map((comp) => (
                    <article
                      key={comp.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-card">
                          {comp.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={comp.logoUrl}
                              alt={comp.name}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <span className="text-sm font-semibold">{comp.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{comp.name}</div>
                          <div className="text-xs text-muted-foreground">Competition</div>
                        </div>
                      </div>
                      <FollowButton entityType="COMPETITION" entityId={comp.id} />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

