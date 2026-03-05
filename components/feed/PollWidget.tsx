'use client'

import { formatDistanceToNow } from 'date-fns'
import type { Poll } from '@/types'
import { cn } from '@/lib/utils'

interface PollWidgetProps {
  poll: Poll
  onVote?: (optionId: string) => void
}

export function PollWidget({ poll, onVote }: PollWidgetProps) {
  const hasVoted = !!poll.votedOptionId
  const total = poll.totalVotes

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
      <p className="font-medium text-sm text-foreground mb-3">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = total > 0 ? (opt.votes / total) * 100 : 0
          const isSelected = poll.votedOptionId === opt.id
          return (
            <div key={opt.id} className="space-y-1">
              {!hasVoted && onVote ? (
                <button
                  type="button"
                  onClick={() => onVote(opt.id)}
                  className="w-full text-left rounded-lg border border-border px-3 py-2 text-sm hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
                  disabled={hasVoted}
                  aria-label={`Vote for ${opt.text}`}
                >
                  {opt.text}
                </button>
              ) : (
                <div
                  className="relative rounded-lg border border-border overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Number(pct.toFixed(0))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${opt.text} votes`}
                >
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-l-lg transition-all duration-500',
                      isSelected ? 'bg-green-500/25' : 'bg-muted'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{opt.text}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {total > 0 ? `${pct.toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
        {' · '}
        Poll closes in {formatDistanceToNow(new Date(poll.endsAt), { addSuffix: true })}
      </p>
    </div>
  )
}
