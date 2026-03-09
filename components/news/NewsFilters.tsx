"use client"

import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompetitionOption {
  id: string
  name: string
}

interface NewsFiltersProps {
  competitions: CompetitionOption[]
  competitionId: string | null
  onCompetitionChange: (id: string | null) => void
  followedOnly: boolean
  onFollowedOnlyChange: (value: boolean) => void
  teamQuery: string
  onTeamQueryChange: (value: string) => void
}

export function NewsFilters({
  competitions,
  competitionId,
  onCompetitionChange,
  followedOnly,
  onFollowedOnlyChange,
  teamQuery,
  onTeamQueryChange,
}: NewsFiltersProps) {
  const [compOpen, setCompOpen] = useState(false)

  const selectedComp = competitions.find((c) => c.id === competitionId)

  const handleTeamQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTeamQueryChange(event.target.value)
  }

  return (
    <div className="space-y-2">
      {/* Row 1: Competition picker + Followed toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Competition dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCompOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              competitionId
                ? 'border-green-500 bg-green-500/10 text-green-600'
                : 'border-border bg-muted/40 text-muted-foreground hover:border-green-500/50 hover:text-foreground'
            )}
          >
            <span>{selectedComp?.name ?? 'All Competitions'}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', compOpen && 'rotate-180')} />
          </button>

          {compOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setCompOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 min-w-[200px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => { onCompetitionChange(null); setCompOpen(false) }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors',
                      !competitionId && 'font-semibold text-green-600'
                    )}
                  >
                    All Competitions
                  </button>
                  {competitions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onCompetitionChange(c.id); setCompOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors',
                        competitionId === c.id && 'font-semibold text-green-600'
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                  {competitions.length === 0 && (
                    <p className="px-4 py-3 text-xs text-muted-foreground">No competitions loaded</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Followed only toggle */}
        <button
          type="button"
          onClick={() => onFollowedOnlyChange(!followedOnly)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            followedOnly
              ? 'border-green-500 bg-green-500/10 text-green-600'
              : 'border-border bg-muted/40 text-muted-foreground hover:border-green-500/50 hover:text-foreground'
          )}
        >
          {followedOnly ? '✓ ' : ''}Followed only
        </button>
      </div>

      {/* Row 2: Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={teamQuery}
          onChange={handleTeamQueryChange}
          placeholder="Search headlines, teams…"
          className="w-full h-8 rounded-full border border-border bg-muted/40 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 transition-colors"
        />
        {teamQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onTeamQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}
