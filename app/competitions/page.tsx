import { AppLayout } from '@/components/app-layout'

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

async function fetchCompetitions(): Promise<CompetitionsResponse> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/football/competitions`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    throw new Error('Failed to load competitions')
  }
  return (await res.json()) as CompetitionsResponse
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
                // eslint-disable-next-line @next/next/no-img-element
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
  const data = await fetchCompetitions()

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
        </main>
      </div>
    </AppLayout>
  )
}

