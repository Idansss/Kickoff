import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ValueQuizContent } from '../ValueQuizContent'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

const MOCK_PLAYER = {
  player: {
    id: 'p1',
    name: 'Erling Haaland',
    position: 'FW',
    nationality: 'Norwegian',
    age: 25,
    photoUrl: null,
    currentTeam: { id: 't1', name: 'City FC', badgeUrl: null },
  },
  valueDate: new Date().toISOString(),
  valueBand: '€100m+',
}

const MOCK_RESULT = {
  playerId: 'p1',
  playerName: 'Erling Haaland',
  guessedValueEur: 175_000_000,
  actualValueEur: 180_000_000,
  guessedFormatted: '€175.0m',
  actualFormatted: '€180.0m',
  deltaEur: -5_000_000,
  deltaFormatted: '-€5.0m',
  deltaDirection: 'under',
  score: 100,
  scoreLabel: 'Perfect!',
  percentageOff: 2.8,
}

const MOCK_HISTORY = {
  attempts: [
    {
      id: 'att1',
      createdAt: new Date().toISOString(),
      player: { id: 'p1', name: 'Erling Haaland', position: 'FW' },
      guessedFormatted: '€175.0m',
      actualFormatted: '€180.0m',
      deltaDirection: 'under',
      score: 100,
      scoreLabel: 'Perfect!',
      percentageOff: 2.8,
    },
  ],
  summary: { totalAttempts: 1, totalScore: 100, avgScore: 100, perfectGuesses: 1 },
}

const MOCK_LEADERBOARD = {
  leaderboard: [
    { rank: 1, userId: 'u1', name: 'Alice', handle: 'alice', totalScore: 500, attempts: 5, avgScore: 100, perfectGuesses: 5 },
  ],
}

describe('ValueQuizContent', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/random')) {
        return Promise.resolve({ ok: true, json: async () => MOCK_PLAYER })
      }
      if (url.includes('/attempt')) {
        return Promise.resolve({ ok: true, json: async () => MOCK_RESULT })
      }
      if (url.includes('/history')) {
        return Promise.resolve({ ok: true, json: async () => MOCK_HISTORY })
      }
      if (url.includes('/leaderboard')) {
        return Promise.resolve({ ok: true, json: async () => MOCK_LEADERBOARD })
      }
      return Promise.resolve({ ok: false })
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders start screen with scoring guide', () => {
    render(<ValueQuizContent />)
    expect(screen.getByText('Guess the Market Value')).toBeDefined()
    expect(screen.getByText('100 pts')).toBeDefined()
    expect(screen.getByText('Start guessing →')).toBeDefined()
  })

  it('loads and shows a player after clicking start', async () => {
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('Start guessing →'))
    await waitFor(() => expect(screen.getByText('Erling Haaland')).toBeDefined())
    expect(screen.getByText('City FC')).toBeDefined()
    expect(screen.getByText('€100m+')).toBeDefined()
  })

  it('shows quick-pick value buttons', async () => {
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('Start guessing →'))
    await waitFor(() => expect(screen.getByText('€50m')).toBeDefined())
    expect(screen.getByText('€120m')).toBeDefined()
  })

  it('sets guess when quick-pick is clicked', async () => {
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('Start guessing →'))
    await waitFor(() => screen.getByText('€50m'))
    fireEvent.click(screen.getByText('€50m'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('50,000,000')
  })

  it('shows result after submitting a guess', async () => {
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('Start guessing →'))
    await waitFor(() => screen.getByText('€50m'))
    fireEvent.click(screen.getByText('€50m'))
    fireEvent.click(screen.getByText('Submit guess'))
    await waitFor(() => expect(screen.getByText('Result')).toBeDefined())
    expect(screen.getByText('€175.0m')).toBeDefined()
    expect(screen.getByText('€180.0m')).toBeDefined()
    expect(screen.getByText(/Perfect/)).toBeDefined()
    expect(screen.getByText('Next player →')).toBeDefined()
  })

  it('switches to history tab and shows attempts', async () => {
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('📋 My history'))
    await waitFor(() => expect(screen.getByText('Erling Haaland')).toBeDefined())
    // Value appears inline inside a paragraph — use regex
    expect(screen.getByText(/Guessed.*€175/)).toBeDefined()
  })

  it('switches to leaderboard tab and shows rankings', async () => {
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('🏆 Leaderboard'))
    await waitFor(() => expect(screen.getByText('Alice')).toBeDefined())
    expect(screen.getByText('500 pts')).toBeDefined()
    expect(screen.getByText('🥇')).toBeDefined()
  })

  it('shows error state when random fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<ValueQuizContent />)
    fireEvent.click(screen.getByText('Start guessing →'))
    await waitFor(() => expect(screen.getByText(/Could not load a player/)).toBeDefined())
  })
})
