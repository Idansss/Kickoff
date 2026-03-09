"use client"

import { Suspense, memo, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/matches/MatchCard'
import { MomentumBar } from '@/components/matches/MomentumBar'
import { MatchTimeline } from '@/components/matches/MatchTimeline'
import { ShotMap } from '@/components/matches/ShotMap'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { getMatchPreview } from '@/lib/claudeClient'
import { cn, formatKickoffTime, scrollToAndHighlight } from '@/lib/utils'
import { matchStore } from '@/store/matchStore'
import type { Match } from '@/types'

interface LiveMatchCardProps {
  match: Match
  onReminder: (matchId: string) => void
  isReminderOn: boolean
}

const LiveMatchCard = memo(function LiveMatchCard({
  match,
  onReminder,
  isReminderOn,
}: LiveMatchCardProps): React.JSX.Element {
  const [showMotm, setShowMotm] = useState(false)
  const showMotmSection = match.minute >= 75
  const motmPlayers = [match.home.name, match.away.name].flatMap((_, index) =>
    index === 0 ? ['Haaland', 'Foden'] : ['Salah', 'Nunez']
  )

  return (
    <div
      id={match.id}
      className={cn(
        'group rounded-xl border transition-all overflow-hidden',
        'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
      )}
    >
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5"
          role="status"
          aria-label="Live match in progress"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-500">LIVE</span>
        </div>
        <span className="text-xs font-semibold text-red-500">{match.minute}&apos;</span>
      </div>

      <div className="p-4">
        <Link href={`/match/${match.id}`} className="block">
          <MatchCard match={match} className="border-0 bg-transparent p-0 rounded-none" />
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReminder(match.id)}
            className="text-xs text-green-600 hover:underline"
            aria-label={isReminderOn ? 'Turn off reminder' : 'Set reminder'}
          >
            {isReminderOn ? 'Reminder on' : 'Set reminder'}
          </button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          xG: {match.xG.home.toFixed(2)} - {match.xG.away.toFixed(2)}
        </div>

        <div className="mt-3">
          <MomentumBar segments={match.momentum} />
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ShotMap shots={match.shots} />
          <MatchTimeline events={match.events} />
        </div>

        {showMotmSection ? (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Man of the match</p>
            <div className="flex flex-wrap gap-2">
              {motmPlayers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setShowMotm((value) => !value)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-green-500/50"
                  aria-label={`Vote ${name} for man of the match`}
                >
                  {name}
                </button>
              ))}
            </div>
            {showMotm ? (
              <p className="mt-2 text-xs text-green-600">Vote submitted.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
})

function renderMatchPreview(preview: string): React.ReactElement | null {
  const trimmed = preview.trim()
  if (!trimmed) return null

  const paragraphs = trimmed.split(/\n\s*\n/)

  const renderInline = (text: string, keyPrefix: string) => {
    const nodes: React.ReactNode[] = []
    const regex = /\*\*(.+?)\*\*/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index))
      }
      nodes.push(
        <strong key={`${keyPrefix}-bold-${nodes.length}`}>
          {match[1]}
        </strong>
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex))
    }

    return nodes
  }

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {paragraphs.map((para, index) => (
        <p
          key={`para-${index}`}
          className={cn(index === 0 ? 'font-semibold' : undefined)}
        >
          {renderInline(para, `p${index}`)}
        </p>
      ))}
    </div>
  )
}

interface UpcomingMatchCardProps {
  match: Match
  onReminder: (matchId: string) => void
  isReminderOn: boolean
}

const UpcomingMatchCard = memo(function UpcomingMatchCard({
  match,
  onReminder,
  isReminderOn,
}: UpcomingMatchCardProps): React.JSX.Element {
  const [preview, setPreview] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const fetchPreview = useCallback(async (): Promise<void> => {
    if (preview !== null || loadingPreview) return

    setLoadingPreview(true)
    setPreviewError(null)
    try {
      const text = await getMatchPreview(match.home.name, match.away.name, match.competition)
      if (text === "Couldn't connect. Try again.") {
        setPreviewError(text)
        return
      }

      setPreview(text)
      setPreviewError(null)
    } finally {
      setLoadingPreview(false)
    }
  }, [loadingPreview, match.away.name, match.competition, match.home.name, preview])

  return (
    <div
      id={match.id}
      className="rounded-xl border border-border transition-all hover:bg-muted/50 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {match.competitionFlag} {match.competition}
          </span>
          <Badge variant="outline" className="text-xs">
            {match.kickoffTime ? formatKickoffTime(match.kickoffTime) : '—'}
          </Badge>
        </div>

        <Link href={`/match/${match.id}`} className="block">
          <MatchCard match={match} className="border-0 bg-transparent p-0 rounded-none" />
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReminder(match.id)}
            className="text-xs text-green-600 hover:underline"
            aria-label={isReminderOn ? 'Turn off reminder' : 'Set reminder'}
          >
            {isReminderOn ? 'Reminder on' : 'Set reminder'}
          </button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={fetchPreview}
            disabled={loadingPreview}
            aria-label="Generate AI preview"
          >
            {loadingPreview ? 'Loading...' : 'AI Preview'}
          </Button>
        </div>

        {previewError ? (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
            {previewError}
          </div>
        ) : null}

        {preview ? (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
            {renderMatchPreview(preview)}
          </div>
        ) : null}
      </div>
    </div>
  )
})

function MatchesPageInner(): React.JSX.Element {
  const liveMatches = matchStore((state) => state.liveMatches)
  const upcomingFixtures = matchStore((state) => state.upcomingFixtures)
  const initMatches = matchStore((state) => state.initMatches)
  const tickMatchMinute = matchStore((state) => state.tickMatchMinute)
  const toggleReminder = matchStore((state) => state.toggleReminder)
  const reminders = matchStore((state) => state.reminders)

  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    initMatches()
    const timeout = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timeout)
  }, [initMatches])

  useEffect(() => {
    intervalRef.current = setInterval(() => tickMatchMinute(), 30000)
    return () => {
      if (!intervalRef.current) return
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [tickMatchMinute])

  useEffect(() => {
    const id = searchParams.get('id')
    const fixtureId = searchParams.get('fixture')
    const tab = searchParams.get('tab')

    if (id) {
      scrollToAndHighlight(id)
    } else if (fixtureId) {
      scrollToAndHighlight(fixtureId)
    }

    if (tab === 'upcoming') {
      scrollToAndHighlight('upcoming-section')
    }
  }, [searchParams])

  const handleToggleReminder = useCallback(
    (matchId: string): void => {
      toggleReminder(matchId)
    },
    [toggleReminder]
  )

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold">Live Matches</h1>
          <p className="text-sm text-muted-foreground">Follow all the action</p>
        </div>

        <div className="p-4 sm:p-6 space-y-8">
          {loading ? (
            <>
              <SkeletonLoader variant="match" />
              <SkeletonLoader variant="match" />
              <SkeletonLoader variant="match" />
            </>
          ) : (
            <>
              {liveMatches.length > 0 ? (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-2 w-2 rounded-full bg-red-500 animate-pulse"
                      role="status"
                      aria-label="Live match in progress"
                    />
                    <h2 className="text-lg font-bold text-red-500">Live Now</h2>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {liveMatches.map((match) => (
                      <LiveMatchCard
                        key={match.id}
                        match={match}
                        onReminder={handleToggleReminder}
                        isReminderOn={reminders.includes(match.id)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {upcomingFixtures.length > 0 ? (
                <section id="upcoming-section">
                  <h2 className="mb-4 text-lg font-bold">Upcoming</h2>
                  <div className="space-y-3">
                    {upcomingFixtures.map((match) => (
                      <UpcomingMatchCard
                        key={match.id}
                        match={match}
                        onReminder={handleToggleReminder}
                        isReminderOn={reminders.includes(match.id)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function MatchesPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <MatchesPageInner />
    </Suspense>
  )
}
