"use client"

interface NewsTabsProps {
  scope: 'latest' | 'transfers' | 'league'
  onChange: (scope: 'latest' | 'transfers' | 'league') => void
}

export function NewsTabs({ scope, onChange }: NewsTabsProps) {
  return (
    <div className="inline-flex gap-1 rounded-full border bg-background p-1 text-[11px]">
      <button
        type="button"
        onClick={() => onChange('latest')}
        className={`rounded-full px-3 py-1 ${
          scope === 'latest' ? 'bg-muted font-semibold' : 'text-muted-foreground'
        }`}
      >
        Latest
      </button>
      <button
        type="button"
        onClick={() => onChange('transfers')}
        className={`rounded-full px-3 py-1 ${
          scope === 'transfers' ? 'bg-muted font-semibold' : 'text-muted-foreground'
        }`}
      >
        Transfers
      </button>
      <button
        type="button"
        onClick={() => onChange('league')}
        className={`rounded-full px-3 py-1 ${
          scope === 'league' ? 'bg-muted font-semibold' : 'text-muted-foreground'
        }`}
      >
        League
      </button>
    </div>
  )
}

