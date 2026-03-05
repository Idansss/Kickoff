"use client"

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import MatchCard from './MatchCard'

type CalendarMatch = {
  id: string
  kickoff: string
  status: string
  competition: { id: string; name: string; logoUrl?: string | null }
  homeTeam: { id: string; name: string; badgeUrl?: string | null; score?: number | null }
  awayTeam: { id: string; name: string; badgeUrl?: string | null; score?: number | null }
}

export default function CalendarMatches() {
  const [selected, setSelected] = useState<Date>(new Date())
  const [matches, setMatches] = useState<CalendarMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateISO = useMemo(() => format(selected, 'yyyy-MM-dd'), [selected])

  async function loadForDate(date: Date) {
    const iso = format(date, 'yyyy-MM-dd')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/football/calendar?date=${encodeURIComponent(iso)}`)
      if (!res.ok) {
        throw new Error('Failed to load matches')
      }
      const json = (await res.json()) as { matches?: CalendarMatch[] }
      setMatches(json.matches ?? [])
    } catch (err) {
      console.error(err)
      setError('Unable to load matches for this day.')
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadForDate(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <div className="rounded-xl border bg-card p-3">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (!d) return
            setSelected(d)
            void loadForDate(d)
          }}
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">{dateISO}</h2>
          {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
        </div>

        {error && <div className="mt-3 text-xs text-red-500">{error}</div>}

        <div className="mt-4 space-y-3">
          {!loading && matches.length === 0 && !error && (
            <div className="text-sm text-muted-foreground">No matches for this date.</div>
          )}

          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  )
}

