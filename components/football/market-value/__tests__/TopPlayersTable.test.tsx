import { render, screen, waitFor } from '@testing-library/react'
import { TopPlayersTable } from '../TopPlayersTable'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}))

const MOCK_PLAYERS = [
  {
    rank: 1,
    id: 'p1',
    name: 'Erling Haaland',
    nationality: 'Norwegian',
    position: 'FW',
    age: 25,
    currentTeam: { id: 't1', name: 'City FC', badgeUrl: null },
    latestValueFormatted: '€180.0m',
    deltaFormatted: '+€10.0m',
    deltaDirection: 'up' as const,
  },
  {
    rank: 2,
    id: 'p2',
    name: 'Bukayo Saka',
    nationality: 'English',
    position: 'FW',
    age: 22,
    currentTeam: { id: 't2', name: 'Arsenal', badgeUrl: null },
    latestValueFormatted: '€140.0m',
    deltaFormatted: '-€10.0m',
    deltaDirection: 'down' as const,
  },
]

beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: MOCK_PLAYERS, total: 2, totalPages: 1 }),
  } as any)
})

afterAll(() => {
  // @ts-expect-error - restore
  delete global.fetch
})

describe('TopPlayersTable', () => {
  it('renders rank column and player names', async () => {
    render(<TopPlayersTable />)
    expect(await screen.findByText('Erling Haaland')).toBeDefined()
    expect(screen.getByText('Bukayo Saka')).toBeDefined()
    // rank numbers
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
  })

  it('shows market values', async () => {
    render(<TopPlayersTable />)
    expect(await screen.findByText('€180.0m')).toBeDefined()
    expect(screen.getByText('€140.0m')).toBeDefined()
  })

  it('shows delta values', async () => {
    render(<TopPlayersTable />)
    expect(await screen.findByText('+€10.0m')).toBeDefined()
    expect(screen.getByText('-€10.0m')).toBeDefined()
  })

  it('shows club names', async () => {
    render(<TopPlayersTable />)
    expect(await screen.findByText('City FC')).toBeDefined()
    expect(screen.getByText('Arsenal')).toBeDefined()
  })

  it('shows loading skeleton initially', () => {
    // Mock a slow fetch so we see the skeleton
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise(() => {}), // never resolves
    )
    render(<TopPlayersTable />)
    // loading state shows skeleton rows (no player names yet)
    expect(screen.queryByText('Erling Haaland')).toBeNull()
  })

  it('shows empty state when no results', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], total: 0, totalPages: 0 }),
    })
    render(<TopPlayersTable />)
    expect(await screen.findByText('No players found.')).toBeDefined()
  })

  it('passes position filter to fetch URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], total: 0, totalPages: 0 }),
    })
    global.fetch = mockFetch
    render(<TopPlayersTable position="FW" />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('position=FW'),
        expect.any(Object),
      )
    })
  })
})
