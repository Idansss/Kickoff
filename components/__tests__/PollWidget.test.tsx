import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PollWidget } from '@/components/feed/PollWidget'
import type { Poll } from '@/types'

const basePoll: Poll = {
  question: 'Who wins?',
  options: [
    { id: 'opt-1', text: 'Team A', votes: 60 },
    { id: 'opt-2', text: 'Team B', votes: 40 },
  ],
  totalVotes: 100,
  endsAt: new Date('2026-03-10T10:00:00.000Z'),
}

describe('PollWidget', () => {
  it('renders option buttons when user has not voted', () => {
    render(<PollWidget poll={basePoll} onVote={() => undefined} />)
    expect(screen.getByRole('button', { name: /vote for team a/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /vote for team b/i })).toBeInTheDocument()
  })

  it('renders percentage bars after voting', () => {
    render(
      <PollWidget
        poll={{
          ...basePoll,
          votedOptionId: 'opt-1',
        }}
      />
    )

    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('clicking an option calls onVote with correct optionId', () => {
    const onVote = vi.fn()
    render(<PollWidget poll={basePoll} onVote={onVote} />)

    fireEvent.click(screen.getByRole('button', { name: /vote for team a/i }))
    expect(onVote).toHaveBeenCalledWith('opt-1')
  })

  it('cannot vote twice when already voted', () => {
    const onVote = vi.fn()
    render(<PollWidget poll={{ ...basePoll, votedOptionId: 'opt-1' }} onVote={onVote} />)

    const optionText = screen.getByText('Team B')
    fireEvent.click(optionText)
    expect(onVote).not.toHaveBeenCalled()
  })
})
