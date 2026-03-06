'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Flame, Trophy, Target, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeBadge: string
  awayBadge: string
  competition: string
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  homeScore?: number
  awayScore?: number
  communityPrediction?: { home: number; draw: number; away: number }
}

interface Prediction {
  matchId: string
  pick: 'home' | 'draw' | 'away'
  scored?: boolean
}

const MATCHES: Match[] = [
  {
    id: 'm1', homeTeam: 'Arsenal', awayTeam: 'Man City', homeBadge: '🔴', awayBadge: '🔵',
    competition: 'Premier League', kickoff: '2026-03-08 12:30', status: 'upcoming',
    communityPrediction: { home: 35, draw: 22, away: 43 },
  },
  {
    id: 'm2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeBadge: '🔵', awayBadge: '⚪',
    competition: 'La Liga', kickoff: '2026-03-08 21:00', status: 'upcoming',
    communityPrediction: { home: 38, draw: 24, away: 38 },
  },
  {
    id: 'm3', homeTeam: 'Liverpool', awayTeam: 'Chelsea', homeBadge: '🔴', awayBadge: '🔵',
    competition: 'Premier League', kickoff: '2026-03-07 20:00', status: 'finished',
    homeScore: 2, awayScore: 1,
    communityPrediction: { home: 52, draw: 20, away: 28 },
  },
  {
    id: 'm4', homeTeam: 'PSG', awayTeam: 'Bayern Munich', homeBadge: '🔵', awayBadge: '🔴',
    competition: 'Champions League', kickoff: '2026-03-11 21:00', status: 'upcoming',
    communityPrediction: { home: 42, draw: 23, away: 35 },
  },
  {
    id: 'm5', homeTeam: 'Juventus', awayTeam: 'Inter Milan', homeBadge: '⚫', awayBadge: '🔵',
    competition: 'Serie A', kickoff: '2026-03-09 20:45', status: 'upcoming',
    communityPrediction: { home: 32, draw: 30, away: 38 },
  },
]

const LEADERBOARD = [
  { rank: 1, name: 'Fabrizio Romano', correct: 24, total: 30, streak: 8 },
  { rank: 2, name: 'OptaJoe', correct: 22, total: 30, streak: 5 },
  { rank: 3, name: 'You', correct: 18, total: 30, streak: 3, isMe: true },
  { rank: 4, name: 'TheAthletic', correct: 17, total: 30, streak: 2 },
  { rank: 5, name: 'Alex Turner', correct: 15, total: 30, streak: 1 },
]

type Tab = 'predictions' | 'leaderboard'

export default function PredictPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('predictions')

  // Load persisted predictions
  useEffect(() => {
    fetch('/api/predictions')
      .then((r) => r.json())
      .then((data: Array<{ matchId: string; outcome: string }>) => {
        if (!Array.isArray(data)) return
        setPredictions(
          data.map((d) => ({
            matchId: d.matchId,
            pick: d.outcome as 'home' | 'draw' | 'away',
          }))
        )
      })
      .catch(() => {})
  }, [])

  const predict = (matchId: string, pick: 'home' | 'draw' | 'away') => {
    setPredictions((prev) => {
      const existing = prev.find((p) => p.matchId === matchId)
      const next = existing
        ? prev.map((p) => p.matchId === matchId ? { ...p, pick } : p)
        : [...prev, { matchId, pick }]
      // Persist to API
      const m = MATCHES.find((m) => m.id === matchId)
      const homeGoals = pick === 'home' ? 1 : pick === 'draw' ? 1 : 0
      const awayGoals = pick === 'away' ? 1 : pick === 'draw' ? 1 : 0
      fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeGoals, awayGoals }),
      }).catch(() => {})
      return next
    })
  }

  const getPrediction = (matchId: string) => predictions.find((p) => p.matchId === matchId)

  const correctPredictions = predictions.filter((p) => {
    const m = MATCHES.find((m) => m.id === p.matchId)
    if (!m || m.status !== 'finished') return false
    if (p.pick === 'home') return (m.homeScore ?? 0) > (m.awayScore ?? 0)
    if (p.pick === 'away') return (m.awayScore ?? 0) > (m.homeScore ?? 0)
    return m.homeScore === m.awayScore
  })

  const totalPredicted = predictions.filter((p) => MATCHES.find(m => m.id === p.matchId)?.status === 'finished').length

  const TABS: { key: Tab; label: string }[] = [
    { key: 'predictions', label: 'Matches' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border min-h-screen">
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 pt-4 pb-0 sm:px-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Predictions</h1>
              <p className="text-xs text-muted-foreground">Predict match outcomes and climb the leaderboard</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-green-600 tabular-nums">{correctPredictions.length}/{totalPredicted}</p>
                <p className="text-[10px] text-muted-foreground">Correct</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold">3 streak</span>
            </div>
            <div className="flex-1 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold">
                {totalPredicted > 0 ? Math.round((correctPredictions.length / totalPredicted) * 100) : 0}% accuracy
              </span>
            </div>
            <div className="flex-1 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-semibold">Rank #3</span>
            </div>
          </div>

          <div className="flex -mb-px">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === t.key
                    ? 'border-green-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-3">
          {activeTab === 'predictions' && MATCHES.map((m) => {
            const pred = getPrediction(m.id)
            const isFinished = m.status === 'finished'
            const actualResult = isFinished
              ? (m.homeScore ?? 0) > (m.awayScore ?? 0) ? 'home'
              : (m.awayScore ?? 0) > (m.homeScore ?? 0) ? 'away' : 'draw'
              : null
            const isCorrect = pred && actualResult && pred.pick === actualResult
            const isWrong = pred && actualResult && pred.pick !== actualResult

            return (
              <div key={m.id} className={cn(
                'rounded-2xl border p-4 space-y-3 transition-colors',
                isCorrect ? 'border-green-500/40 bg-green-500/5' : isWrong ? 'border-red-500/30' : 'border-border'
              )}>
                {/* Match info */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">{m.competition}</span>
                  <div className="flex items-center gap-1.5">
                    {m.status === 'live' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    <span className={cn('text-xs font-semibold',
                      m.status === 'live' ? 'text-red-500' : m.status === 'finished' ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {m.status === 'finished' ? `${m.homeScore}–${m.awayScore}` : m.status === 'live' ? 'LIVE' : m.kickoff.split(' ')[1]}
                    </span>
                    {isCorrect && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {isWrong && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.homeBadge}</span>
                    <span>{m.homeTeam}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <div className="flex items-center gap-2">
                    <span>{m.awayTeam}</span>
                    <span className="text-xl">{m.awayBadge}</span>
                  </div>
                </div>

                {/* Prediction buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {(['home', 'draw', 'away'] as const).map((pick) => {
                    const label = pick === 'home' ? m.homeTeam : pick === 'away' ? m.awayTeam : 'Draw'
                    const selected = pred?.pick === pick
                    const isResult = actualResult === pick
                    const pct = m.communityPrediction?.[pick] ?? 33

                    return (
                      <button
                        key={pick}
                        type="button"
                        disabled={isFinished}
                        onClick={() => !isFinished && predict(m.id, pick)}
                        className={cn(
                          'relative flex flex-col items-center gap-1 rounded-xl border py-2.5 px-2 text-xs font-semibold transition-all overflow-hidden',
                          selected && !isFinished
                            ? 'border-green-500 bg-green-500/10 text-green-600'
                            : isResult && isFinished
                            ? 'border-green-500/40 bg-green-500/5 text-green-600'
                            : isFinished
                            ? 'border-border text-muted-foreground cursor-default opacity-60'
                            : 'border-border text-muted-foreground hover:border-green-500/50 hover:text-foreground'
                        )}
                      >
                        {/* community background bar */}
                        <div
                          className="absolute bottom-0 left-0 h-1 bg-green-500/20 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative">{label}</span>
                        <span className="relative text-[10px] text-muted-foreground">{pct}%</span>
                      </button>
                    )
                  })}
                </div>

                {pred && !isFinished && (
                  <p className="text-xs text-center text-muted-foreground">
                    Your pick: <span className="font-semibold text-green-600">
                      {pred.pick === 'home' ? m.homeTeam : pred.pick === 'away' ? m.awayTeam : 'Draw'}
                    </span>
                  </p>
                )}
              </div>
            )
          })}

          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm text-muted-foreground mb-3">This Season</h2>
              {LEADERBOARD.map((entry) => {
                const pct = Math.round((entry.correct / entry.total) * 100)
                return (
                  <div
                    key={entry.rank}
                    className={cn(
                      'rounded-xl border p-4 flex items-center gap-3',
                      entry.isMe ? 'border-green-500/50 bg-green-500/5' : 'border-border'
                    )}
                  >
                    <span className="text-lg font-bold text-muted-foreground w-6 text-center">{entry.rank}</span>
                    <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                      {entry.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-semibold text-sm', entry.isMe && 'text-green-600')}>{entry.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                          <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                        {entry.streak >= 3 && (
                          <span className="text-xs flex items-center gap-0.5 text-orange-500">
                            <Flame className="h-3 w-3" />{entry.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{entry.correct}/{entry.total}</p>
                      <p className="text-xs text-muted-foreground">correct</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
