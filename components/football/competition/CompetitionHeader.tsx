import Image from 'next/image'

interface CompetitionHeaderProps {
  competition: {
    id: string
    name: string
    country: string | null
    type: string | null
    logoUrl: string | null
  }
  stats: {
    teamsCount: number
    matchesCount: number
    currentRound: string
  }
}

export function CompetitionHeader({ competition, stats }: CompetitionHeaderProps) {
  return (
    <header className="border-b border-border bg-background/80 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        {competition.logoUrl ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={competition.logoUrl} alt={competition.name} fill sizes="40px" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-sm font-semibold">
            {competition.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold leading-tight sm:text-xl">{competition.name}</h1>
          <p className="text-xs text-muted-foreground">
            {competition.country ?? 'International'} · {competition.type ?? 'Competition'}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs sm:text-sm">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-lg font-semibold tabular-nums">{stats.teamsCount}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Teams</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-lg font-semibold tabular-nums">{stats.matchesCount}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Matches</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-xs font-semibold">{stats.currentRound}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Current round</div>
        </div>
      </div>
    </header>
  )
}

