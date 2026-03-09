import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TeamTabs } from '@/components/football/team/TeamTabs'

beforeEach(() => {
  vi.spyOn(global, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe('TeamTabs', () => {
  it('renders all eight tab triggers', () => {
    render(<TeamTabs teamId="t1" />)

    expect(screen.getByRole('tab', { name: /^news$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^matches$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^table$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^stats$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^transfers$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^squad$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^trophies$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /squad value/i })).toBeInTheDocument()
  })
})
