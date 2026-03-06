import { AppLayout } from '@/components/app-layout'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface CompetitionSummary {
  id: string
  name: string
  country: string | null
  type: string | null
  logoUrl: string | null
}

interface CompetitionsResponse {
  leagues: CompetitionSummary[]
  cups: CompetitionSummary[]
  international: CompetitionSummary[]
}

async function getCompetitions(): Promise<CompetitionsResponse> {
  try {
    const competitions = await db.competition.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        type: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
    })

    const leagues = competitions.filter((c) => (c.type ?? '').toLowerCase() === 'league')
    const cups = competitions.filter((c) => (c.type ?? '').toLowerCase() === 'cup')
    const international = competitions.filter(
      (c) => (c.type ?? '').toLowerCase() === 'international',
    )
    return { leagues, cups, international }
  } catch {
    return {
      leagues: [],
      cups: [],
      international: [],
    }
  }
}

function Section({
  title,
  competitions,
}: {
  title: string
  competitions: CompetitionSummary[]
}) {
  if (competitions.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-1 gap-2">
        {competitions.map((c) => (
          <a
            key={c.id}
            href={`/competitions/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-muted/60"
          >
            <div className="flex items-center gap-3">
              {c.logoUrl ? (
                <img
                  src={c.logoUrl}
                  alt={c.name}
                  className="h-7 w-7 flex-shrink-0 rounded-lg border border-border bg-muted"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted text-[11px] font-semibold">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium leading-snug">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {c.country ?? 'International'} · {c.type ?? 'Competition'}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default async function CompetitionsPage() {
  const data = await getCompetitions()

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
          <h1 className="text-xl font-bold">Competitions</h1>
          <p className="text-sm text-muted-foreground">
            Explore leagues, cups and international tournaments.
          </p>
        </div>
        <main className="space-y-8 p-4 sm:p-6">
          <Section title="Leagues" competitions={data.leagues} />
          <Section title="Cups" competitions={data.cups} />
          <Section title="International" competitions={data.international} />
          {data.leagues.length === 0 && data.cups.length === 0 && data.international.length === 0 && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">No competitions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Seed the database with sample data: run{' '}
                <code className="rounded bg-muted px-1 py-0.5">npm run db:seed</code> locally, or
                with <code className="rounded bg-muted px-1 py-0.5">DATABASE_URL</code> set for production.
              </p>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  )
}
