import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { FollowButton } from '@/components/common/FollowButton'
import { followStore } from '@/store/followStore'

describe('FollowButton', () => {
  beforeEach(() => {
    followStore.setState({
      follows: {
        teams: [],
        players: [],
        matches: [],
        competitions: [],
      },
    })

    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, following: true }),
    } as Response)
  })

  it('toggles follow state on click', async () => {
    render(<FollowButton entityType="TEAM" entityId="t1" />)

    const button = await screen.findByRole('button', { name: /follow/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    await waitFor(() => {
      const state = followStore.getState()
      expect(state.isFollowing('TEAM', 't1')).toBe(true)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/follow',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })
})

