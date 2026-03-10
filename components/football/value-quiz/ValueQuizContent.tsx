'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'
import { useQuizStore } from '@/store/quizStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizPlayer {
  id: string
  name: string
  position: string | null
  nationality: string | null
  age: number | null
  photoUrl: string | null
  currentTeam: { id: string; name: string; badgeUrl: string | null } | null
}

interface RandomResponse {
  player: QuizPlayer
  valueDate: string
  valueBand: string
}

interface AttemptResult {
  playerId: string
  playerName: string
  guessedValueEur: number
  actualValueEur: number
  guessedFormatted: string
  actualFormatted: string
  deltaEur: number
  deltaFormatted: string
  deltaDirection: 'over' | 'under' | 'exact'
  score: number
  scoreLabel: string
  percentageOff: number
}

interface HistoryAttempt {
  id: string
  createdAt: string
  player: { id: string; name: string; position: string | null }
  guessedFormatted: string
  actualFormatted: string
  deltaDirection: 'over' | 'under' | 'exact'
  score: number
  scoreLabel: string
  percentageOff: number
}

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  handle: string
  totalScore: number
  attempts: number
  avgScore: number
  perfectGuesses: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score === 100 ? 'bg-green-500' :
    score >= 75   ? 'bg-emerald-500' :
    score >= 50   ? 'bg-yellow-500' :
    score >= 25   ? 'bg-orange-500' :
                    'bg-red-500'

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${color}`}>
      {score} pts
    </span>
  )
}

function GuessInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  // Format with commas for display; raw numeric string stored
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    onChange(raw)
  }

  const display = value ? Number(value).toLocaleString() : ''

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-sm font-bold text-muted-foreground">€</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        className="w-full rounded-xl border bg-background py-3 pl-7 pr-4 text-lg font-bold outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
    </div>
  )
}

// Quick-pick buttons
const QUICK_VALUES = [
  { label: '€5m', eur: 5_000_000 },
  { label: '€10m', eur: 10_000_000 },
  { label: '€25m', eur: 25_000_000 },
  { label: '€50m', eur: 50_000_000 },
  { label: '€80m', eur: 80_000_000 },
  { label: '€120m', eur: 120_000_000 },
  { label: '€150m', eur: 150_000_000 },
  { label: '€200m', eur: 200_000_000 },
]

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'game' | 'history' | 'leaderboard'

export function ValueQuizContent() {
  const [tab, setTab] = useState<Tab>('game')

  // Game state — persisted across refreshes via quizStore
  const { player, valueBand, guess, result, streak, setPlayer, setGuess, setResult, resetRound } =
    useQuizStore()
  const [loadingPlayer, setLoadingPlayer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // History
  const [history, setHistory] = useState<HistoryAttempt[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historySummary, setHistorySummary] = useState<{
    totalAttempts: number; totalScore: number; avgScore: number; perfectGuesses: number
  } | null>(null)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbLoaded, setLbLoaded] = useState(false)

  const fetchPlayer = useCallback(async () => {
    setLoadingPlayer(true)
    setError(null)
    resetRound()
    try {
      const res = await fetch('/api/value-quiz/random')
      if (!res.ok) {
        const json = await res.json().catch(() => null) as { error?: string } | null
        setError(json?.error === 'No players with market values found'
          ? 'No market value data in the database yet. Add some players with market values to play!'
          : 'Could not load a player. Try again.')
        return
      }
      const json = (await res.json()) as RandomResponse
      setPlayer(json.player, json.valueBand)
    } catch {
      setError('Could not load a player. Try again.')
    } finally {
      setLoadingPlayer(false)
    }
  }, [resetRound, setPlayer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!player || !guess) return
    const guessedValueEur = parseInt(guess, 10)
    if (!guessedValueEur || guessedValueEur <= 0) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/value-quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id, guessedValueEur }),
      })
      if (!res.ok) { setError('Failed to submit guess.'); return }
      const json = (await res.json()) as AttemptResult
      setResult(json)
    } catch {
      setError('Failed to submit guess.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTabChange(t: Tab) {
    setTab(t)
    if (t === 'history' && !historyLoaded) {
      try {
        const res = await fetch('/api/value-quiz/history')
        if (res.ok) {
          const json = (await res.json()) as { attempts: HistoryAttempt[]; summary: typeof historySummary }
          setHistory(json.attempts)
          setHistorySummary(json.summary)
          setHistoryLoaded(true)
        }
      } catch { /* silent */ }
    }
    if (t === 'leaderboard' && !lbLoaded) {
      try {
        const res = await fetch('/api/value-quiz/leaderboard')
        if (res.ok) {
          const json = (await res.json()) as { leaderboard: LeaderboardEntry[] }
          setLeaderboard(json.leaderboard)
          setLbLoaded(true)
        }
      } catch { /* silent */ }
    }
  }

  // ── Game tab ──────────────────────────────────────────────────────────────

  function renderGame() {
    if (!player && !loadingPlayer) {
      return (
        <div className="flex flex-col items-center gap-6 py-10">
          <div className="space-y-1 text-center">
            <p className="text-4xl">⚽</p>
            <h2 className="text-lg font-bold">Guess the Market Value</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll show you a player — you guess their Transfermarkt value.
              Closer = more points.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            {[
              { pts: 100, label: 'Within 5%' },
              { pts: 75, label: 'Within 10%' },
              { pts: 50, label: 'Within 20%' },
              { pts: 25, label: 'Within 40%' },
            ].map((row) => (
              <div key={row.pts} className="rounded-xl border bg-card px-3 py-2">
                <p className="font-bold">{row.pts} pts</p>
                <p className="text-muted-foreground">{row.label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => void fetchPlayer()}
            className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Start guessing →
          </button>
        </div>
      )
    }

    if (loadingPlayer) {
      return (
        <div className="space-y-3 py-6">
          <div className="h-32 animate-pulse rounded-xl border bg-muted" />
          <div className="h-12 animate-pulse rounded-xl border bg-muted" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Player card */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-4">
            {player!.photoUrl ? (
              <Image
                src={player!.photoUrl}
                alt={player!.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl">
                👤
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold">{player!.name}</h2>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {player!.position && <span className="rounded-full border px-2 py-0.5">{player!.position}</span>}
                {player!.nationality && <span>{player!.nationality}</span>}
                {player!.age !== null && <span>{player!.age} yrs</span>}
              </div>
              {player!.currentTeam && (
                <div className="mt-1">
                  <ClubIdentity
                    name={player!.currentTeam.name}
                    badgeUrl={player!.currentTeam.badgeUrl}
                    href={`/club/${player!.currentTeam.id}`}
                    size="xs"
                    textClassName="text-muted-foreground hover:underline"
                  />
                </div>
              )}
            </div>
          </div>
          {valueBand && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Hint: value is roughly in the <span className="font-semibold">{valueBand}</span> range
            </p>
          )}
        </div>

        {/* Result overlay */}
        {result ? (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Result</h3>
              <ScoreBadge score={result.score} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg border bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">Your guess</p>
                <p className="font-bold">{result.guessedFormatted}</p>
              </div>
              <div className="rounded-lg border bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">Actual value</p>
                <p className="font-bold">{result.actualFormatted}</p>
              </div>
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold ${result.deltaDirection === 'over' ? 'text-red-500' : result.deltaDirection === 'under' ? 'text-amber-500' : 'text-green-500'}`}>
                {result.deltaDirection === 'exact'
                  ? '🎯 Exact!'
                  : `${result.deltaFormatted} (${result.percentageOff}% ${result.deltaDirection})`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{result.scoreLabel}</p>
              {streak > 1 && (
                <p className="mt-1 text-xs font-medium text-amber-500">🔥 {streak} scoring streak!</p>
              )}
            </div>
            <button
              onClick={() => void fetchPlayer()}
              className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Next player →
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            {/* Quick-pick buttons */}
            <div className="flex flex-wrap gap-2">
              {QUICK_VALUES.map((qv) => (
                <button
                  key={qv.eur}
                  type="button"
                  onClick={() => setGuess(String(qv.eur))}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted ${
                    guess === String(qv.eur) ? 'border-primary bg-primary/10 text-primary' : ''
                  }`}
                >
                  {qv.label}
                </button>
              ))}
            </div>
            <GuessInput value={guess} onChange={setGuess} disabled={submitting} />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !guess || parseInt(guess) <= 0}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Checking…' : 'Submit guess'}
            </button>
          </form>
        )}
      </div>
    )
  }

  // ── History tab ───────────────────────────────────────────────────────────

  function renderHistory() {
    if (!historyLoaded) {
      return (
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl border bg-muted" />)}
        </div>
      )
    }

    if (history.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No attempts yet. Play the quiz to build your history!
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* Summary strip */}
        {historySummary && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Attempts', value: historySummary.totalAttempts },
              { label: 'Total score', value: historySummary.totalScore },
              { label: 'Avg score', value: historySummary.avgScore },
              { label: 'Perfects', value: historySummary.perfectGuesses },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card px-2 py-2">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-px overflow-hidden rounded-xl border bg-card">
          {history.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <div>
                <p className="font-medium">{a.player.name}</p>
                <p className="text-muted-foreground">
                  Guessed {a.guessedFormatted} · Actual {a.actualFormatted}
                  <span className={` ml-1 ${
                    a.deltaDirection === 'over' ? 'text-red-500' :
                    a.deltaDirection === 'under' ? 'text-amber-500' :
                    'text-green-500'
                  }`}>
                    ({a.percentageOff}% {a.deltaDirection})
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <ScoreBadge score={a.score} />
                <span className="text-[10px] text-muted-foreground">{a.scoreLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Leaderboard tab ───────────────────────────────────────────────────────

  function renderLeaderboard() {
    if (!lbLoaded) {
      return (
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl border bg-muted" />)}
        </div>
      )
    }

    if (leaderboard.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No scores yet. Be the first on the leaderboard!
        </div>
      )
    }

    const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

    return (
      <div className="space-y-px overflow-hidden rounded-xl border bg-card">
        {leaderboard.map((entry) => (
          <div key={entry.userId} className="flex items-center gap-3 px-4 py-2.5 text-xs">
            <span className="w-8 text-center text-base">
              {MEDAL[entry.rank] ?? `#${entry.rank}`}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{entry.name}</p>
              <p className="text-muted-foreground">
                @{entry.handle} · {entry.attempts} attempt{entry.attempts !== 1 ? 's' : ''}
                {entry.perfectGuesses > 0 && ` · 🎯 ${entry.perfectGuesses} perfect`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{entry.totalScore} pts</p>
              <p className="text-muted-foreground">avg {entry.avgScore}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: 'game', label: '⚽ Guess' },
    { key: 'history', label: '📋 My history' },
    { key: 'leaderboard', label: '🏆 Leaderboard' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border bg-muted p-1">
        {TAB_LABELS.map((t) => (
          <button
            key={t.key}
            onClick={() => void handleTabChange(t.key)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'game' && renderGame()}
      {tab === 'history' && renderHistory()}
      {tab === 'leaderboard' && renderLeaderboard()}

      <p className="text-center text-[10px] text-muted-foreground">
        Values sourced from our{' '}
        <Link href="/market-values" className="hover:underline">
          market value database
        </Link>
      </p>
    </div>
  )
}
