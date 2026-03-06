'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  homeTeam: string
  awayTeam: string
}

const SUGGESTIONS = [
  'How should the home team press?',
  'What are the key tactical battles?',
  'How to exploit the away team\'s weaknesses?',
  'Best counter-attacking strategy?',
]

export function TacticalAI({ homeTeam, awayTeam }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)

  const ask = async (q?: string) => {
    const finalQ = q ?? question
    if (!finalQ.trim()) return
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/ai/tactical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeam, awayTeam, question: finalQ }),
      })
      const data = await res.json() as { analysis: string }
      setAnalysis(data.analysis)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-sm">AI Tactical Breakdown</span>
          <span className="text-xs bg-green-500/15 text-green-600 rounded-full px-2 py-0.5 font-semibold">AI</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 border-t border-border space-y-3">
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuestion(s); ask(s) }}
                className="text-xs border border-border rounded-full px-3 py-1.5 text-muted-foreground hover:border-green-500/50 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Custom question */}
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about ${homeTeam} vs ${awayTeam}…`}
              className="text-sm"
              onKeyDown={(e) => e.key === 'Enter' && ask()}
            />
            <Button
              size="sm"
              onClick={() => ask()}
              disabled={loading || !question.trim()}
              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {/* Analysis */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
              Analysing tactics…
            </div>
          )}
          {analysis && (
            <div className="rounded-xl bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap animate-fade-in-up">
              {analysis}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
