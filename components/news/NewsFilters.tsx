"use client"

import type { ChangeEvent } from 'react'

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
  const handleCompetitionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    onCompetitionChange(value === '' ? null : value)
  }

  const handleFollowedChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFollowedOnlyChange(event.target.checked)
  }

  const handleTeamQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTeamQueryChange(event.target.value)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">Competition</span>
          <select
            value={competitionId ?? ''}
            onChange={handleCompetitionChange}
            className="h-8 min-w-[140px] rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="">All</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 items-center gap-2">
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">Team filter</span>
          <input
            type="text"
            value={teamQuery}
            onChange={handleTeamQueryChange}
            placeholder="Search in titles (optional)"
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={followedOnly}
          onChange={handleFollowedChange}
          className="h-3.5 w-3.5 rounded border-border"
        />
        <span className="text-[11px] font-medium">Followed only</span>
      </label>
    </div>
  )
}

