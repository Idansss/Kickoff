'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowRight, Sparkles, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react'

interface Transfer {
  id: string
  player: string
  fromTeam: string
  toTeam: string
  fee: string
  type: 'confirmed' | 'rumour' | 'done'
  date: string
  credibility?: number
  source?: string
}

const MOCK_TRANSFERS: Transfer[] = [
  { id: '1', player: 'Kylian Mbappé', fromTeam: 'Paris Saint-Germain', toTeam: 'Real Madrid', fee: '€0 (Free)', type: 'done', date: '2024-06-01', source: 'Official' },
  { id: '2', player: 'Declan Rice', fromTeam: 'West Ham', toTeam: 'Arsenal', fee: '€116m', type: 'done', date: '2023-07-15', source: 'Official' },
  { id: '3', player: 'Jadon Sancho', fromTeam: 'Manchester United', toTeam: 'Chelsea', fee: '€25m', type: 'done', date: '2024-01-30', source: 'Official' },
  { id: '4', player: 'Victor Osimhen', fromTeam: 'Napoli', toTeam: 'Galatasaray', fee: '€75m', type: 'rumour', date: '2025-03-01', credibility: 7, source: 'Fabrizio Romano' },
  { id: '5', player: 'Florian Wirtz', fromTeam: 'Bayer Leverkusen', toTeam: 'Manchester City', fee: '€120m', type: 'rumour', date: '2025-02-28', credibility: 6, source: 'The Athletic' },
  { id: '6', player: 'Jonathan David', fromTeam: 'Lille', toTeam: 'Liverpool', fee: '€40m', type: 'confirmed', date: '2025-03-05', credibility: 9, source: 'Fabrizio Romano' },
  { id: '7', player: 'Leny Yoro', fromTeam: 'Lille', toTeam: 'Manchester United', fee: '€62m', type: 'done', date: '2024-07-20', source: 'Official' },
  { id: '8', player: 'Xavi Simons', fromTeam: 'RB Leipzig', toTeam: 'Paris Saint-Germain', fee: '€80m', type: 'rumour', date: '2025-03-04', credibility: 5, source: 'L\'Equipe' },
]

// Club colors + abbreviations
const CLUB_INFO: Record<string, { color: string; abbr: string }> = {
  'Paris Saint-Germain': { color: '#004170', abbr: 'PSG' },
  'Real Madrid': { color: '#FEBE10', abbr: 'RMA' },
  'Arsenal': { color: '#EF0107', abbr: 'ARS' },
  'West Ham': { color: '#7A263A', abbr: 'WHU' },
  'Chelsea': { color: '#034694', abbr: 'CHE' },
  'Manchester United': { color: '#DA291C', abbr: 'MUN' },
  'Manchester City': { color: '#6CABDD', abbr: 'MCI' },
  'Liverpool': { color: '#C8102E', abbr: 'LIV' },
  'Napoli': { color: '#12A0D7', abbr: 'NAP' },
  'Galatasaray': { color: '#E40000', abbr: 'GAL' },
  'Bayer Leverkusen': { color: '#E32221', abbr: 'B04' },
  'Lille': { color: '#C41E3A', abbr: 'LIL' },
  'RB Leipzig': { color: '#E21E25', abbr: 'RBL' },
  'Tottenham': { color: '#132257', abbr: 'TOT' },
  'Barcelona': { color: '#004D98', abbr: 'BAR' },
  'Atletico Madrid': { color: '#CE3524', abbr: 'ATL' },
  'Bayern Munich': { color: '#DC052D', abbr: 'BAY' },
  'Juventus': { color: '#000000', abbr: 'JUV' },
  'Inter Milan': { color: '#010E80', abbr: 'INT' },
  'AC Milan': { color: '#FB090B', abbr: 'MIL' },
}

function getClubInfo(team: string) {
  if (CLUB_INFO[team]) return CLUB_INFO[team]
  const abbr = team.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  return { color: '#6b7280', abbr }
}

function ClubBadge({ team, size = 'md' }: { team: string; size?: 'sm' | 'md' }) {
  const info = getClubInfo(team)
  const dim = size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[10px]'
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white shrink-0', dim)}
      style={{ backgroundColor: info.color }}
      title={team}
    >
      {info.abbr.slice(0, 3)}
    </div>
  )
}

function PlayerAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

interface RumourAnalysis {
  score: number
  scoreLabel: string
  factors: string[]
  verdict: 'Likely' | 'Unlikely' | 'Too Early'
  analysis: string
}

type FilterType = 'all' | 'confirmed' | 'rumour' | 'done'

function CredibilityBar({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{score}/10</span>
    </div>
  )
}

export default function TransfersPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [rumourInput, setRumourInput] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [analysis, setAnalysis] = useState<RumourAnalysis | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS)

  useEffect(() => {
    fetch('/api/transfers')
      .then((r) => r.json())
      .then((data: Transfer[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTransfers(data)
        }
      })
      .catch(() => {})
  }, [])

  const filtered = transfers.filter((t) => filter === 'all' || t.type === filter)

  const analyseRumour = async () => {
    if (!rumourInput.trim()) return
    setAnalysing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/ai/transfer-rumour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rumour: rumourInput }),
      })
      const data = await res.json() as RumourAnalysis
      setAnalysis(data)
    } finally {
      setAnalysing(false)
    }
  }

  const verdictColor = (v: string) =>
    v === 'Likely' ? 'text-green-600 bg-green-500/10 border-green-500/30'
    : v === 'Unlikely' ? 'text-red-500 bg-red-500/10 border-red-500/30'
    : 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30'

  const typeIcon = (type: Transfer['type']) => {
    if (type === 'done') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (type === 'confirmed') return <TrendingUp className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const typeBadge = (type: Transfer['type']) => {
    if (type === 'done') return 'bg-green-500/10 text-green-600 border-green-500/30'
    if (type === 'confirmed') return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
    return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'done', label: 'Done Deals' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'rumour', label: 'Rumours' },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 pt-4 pb-0 sm:px-6">
          <h1 className="text-xl font-bold mb-1">Transfer Centre</h1>
          <p className="text-sm text-muted-foreground mb-3">Latest deals, rumours, and AI-powered analysis</p>
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  filter === f.key
                    ? 'border-green-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 text-xs rounded-full px-1.5 py-0.5',
                  filter === f.key ? 'bg-green-500/15 text-green-600' : 'bg-muted text-muted-foreground'
                )}>
                  {f.key === 'all' ? transfers.length : transfers.filter(t => t.type === f.key).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* AI Rumour Analyser */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <h2 className="font-semibold text-sm">AI Rumour Analyser</h2>
            </div>
            <p className="text-xs text-muted-foreground">Paste any transfer rumour and get an instant credibility score</p>
            <div className="flex gap-2">
              <Input
                value={rumourInput}
                onChange={(e) => setRumourInput(e.target.value)}
                placeholder="e.g. 'Salah to Saudi Arabia for £200m next summer'"
                className="text-sm"
                onKeyDown={(e) => e.key === 'Enter' && analyseRumour()}
              />
              <Button
                onClick={analyseRumour}
                disabled={analysing || !rumourInput.trim()}
                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                size="sm"
              >
                {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyse'}
              </Button>
            </div>

            {analysis && (
              <div className="rounded-xl bg-background border border-border p-4 space-y-3 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Credibility</span>
                    <span className={cn('text-xs border rounded-full px-2 py-0.5 font-semibold', verdictColor(analysis.verdict))}>
                      {analysis.verdict}
                    </span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{analysis.score}<span className="text-sm font-normal text-muted-foreground">/10</span></span>
                </div>
                <CredibilityBar score={analysis.score} />
                <p className="text-sm text-foreground/90">{analysis.analysis}</p>
                {analysis.factors.length > 0 && (
                  <ul className="space-y-1">
                    {analysis.factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-green-500 mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Transfer list */}
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="rounded-xl border border-border p-4 space-y-3 hover:bg-muted/30 transition-colors">
                {/* Player row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={t.player} />
                    <div>
                      <div className="flex items-center gap-2">
                        {typeIcon(t.type)}
                        <p className="font-semibold text-sm">{t.player}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs border rounded-full px-2 py-0.5 font-medium shrink-0', typeBadge(t.type))}>
                    {t.type === 'done' ? 'Done Deal' : t.type === 'confirmed' ? 'Confirmed' : 'Rumour'}
                  </span>
                </div>

                {/* Transfer direction with club badges */}
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ClubBadge team={t.fromTeam} />
                    <span className="font-medium text-sm truncate">{t.fromTeam}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="font-medium text-sm text-green-600 truncate text-right">{t.toTeam}</span>
                    <ClubBadge team={t.toTeam} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground text-sm">{t.fee}</span>
                  {t.source && <span>Source: {t.source}</span>}
                </div>

                {t.type === 'rumour' && t.credibility !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Credibility</p>
                    <CredibilityBar score={t.credibility} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
