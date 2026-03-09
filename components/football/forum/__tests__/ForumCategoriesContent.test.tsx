import { render, screen, waitFor } from '@testing-library/react'
import { ForumCategoriesContent } from '../ForumCategoriesContent'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

const MOCK_CATEGORIES = [
  {
    id: 'cat1',
    slug: 'transfers',
    name: 'Transfers',
    description: 'Transfer news and rumours',
    threadCount: 12,
    latestActivity: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'cat2',
    slug: 'tactics',
    name: 'Tactics',
    description: null,
    threadCount: 0,
    latestActivity: null,
  },
]

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ categories: MOCK_CATEGORIES }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ForumCategoriesContent', () => {
  it('renders categories after loading', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText('Transfers')).toBeDefined())
    expect(screen.getByText('Tactics')).toBeDefined()
  })

  it('shows description when present', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText('Transfer news and rumours')).toBeDefined())
  })

  it('shows thread count', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText('12 threads')).toBeDefined())
  })

  it('shows 0 threads label for empty category', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText('0 threads')).toBeDefined())
  })

  it('shows relative time for latestActivity', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText(/m ago/)).toBeDefined())
  })

  it('shows — for null latestActivity', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText('—')).toBeDefined())
  })

  it('renders links to category pages', async () => {
    render(<ForumCategoriesContent />)
    await waitFor(() => {
      const links = screen.getAllByRole('link') as HTMLAnchorElement[]
      const hrefs = links.map((l) => l.getAttribute('href'))
      expect(hrefs).toContain('/forums/transfers')
      expect(hrefs).toContain('/forums/tactics')
    })
  })

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText(/Could not load forum categories/)).toBeDefined())
  })

  it('shows empty state when no categories returned', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [] }),
    })
    render(<ForumCategoriesContent />)
    await waitFor(() => expect(screen.getByText(/No forum categories found/)).toBeDefined())
  })
})
