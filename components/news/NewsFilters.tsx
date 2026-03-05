"use client"

import type { ChangeEvent } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const handleCompetitionChange = (value: string) => {
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
          <Select value={competitionId ?? ''} onValueChange={handleCompetitionChange}>
            <SelectTrigger className="h-8 min-w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {competitions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

