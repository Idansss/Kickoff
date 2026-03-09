import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentsContent } from '../AgentsContent'

vi.mock('next/navigation', () => {
  const params = new URLSearchParams()
  return {
    useSearchParams: () => params,
    useRouter: () => ({
      replace: vi.fn(),
    }),
  }
})

const MOCK_RESULTS = [
  {
    id: 'agent1',
    name: 'Mino Rossi',
    country: 'Italy',
    email: 'mino@example.com',
    agencies: [{ id: 'agency1', name: 'Elite Football Agency', role: 'Founder' }],
    clientCount: 5,
    totalClientValueFormatted: '€400.0m',
  },
  {
    id: 'agent2',
    name: 'Sarah Klein',
    country: 'Germany',
    email: 'sarah@example.com',
    agencies: [],
    clientCount: 0,
    totalClientValueFormatted: null,
  },
]

beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      results: MOCK_RESULTS,
      total: MOCK_RESULTS.length,
      totalPages: 1,
    }),
  } as any)
})

afterAll(() => {
  // @ts-expect-error - restore
  delete global.fetch
})

describe('AgentsContent', () => {
  it('renders filter sidebar with search, country and sort inputs', async () => {
    render(<AgentsContent />)

    const searchInput = await screen.findByPlaceholderText('Search agents…')
    const countryInput = screen.getByPlaceholderText('Italy, England…')
    const sortSelect = screen.getByDisplayValue('Most clients')

    expect(searchInput).toBeDefined()
    expect(countryInput).toBeDefined()
    expect(sortSelect).toBeDefined()
  })

  it('displays agent names from API response', async () => {
    render(<AgentsContent />)
    expect(await screen.findByText('Mino Rossi')).toBeDefined()
    expect(screen.getByText('Sarah Klein')).toBeDefined()
  })

  it('shows portfolio value and client count', async () => {
    render(<AgentsContent />)
    expect(await screen.findByText('€400.0m')).toBeDefined()
    expect(screen.getByText('5 clients')).toBeDefined()
  })

  it('shows agency affiliation link', async () => {
    render(<AgentsContent />)
    const agencyLink = await screen.findByText('Elite Football Agency (Founder)')
    expect(agencyLink).toBeDefined()
  })

  it('updates filter state on name input change', async () => {
    render(<AgentsContent />)
    const searchInput = (await screen.findByPlaceholderText('Search agents…')) as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'Mino' } })
    await waitFor(() => {
      expect(searchInput.value).toBe('Mino')
    })
  })

  it('updates sort selection', async () => {
    render(<AgentsContent />)
    const sortSelect = (await screen.findByRole('combobox')) as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: 'value_desc' } })
    await waitFor(() => {
      expect(sortSelect.value).toBe('value_desc')
    })
  })

  it('shows reset button when filters are active and clears on click', async () => {
    render(<AgentsContent />)
    const searchInput = await screen.findByPlaceholderText('Search agents…')
    fireEvent.change(searchInput, { target: { value: 'Test' } })

    const resetBtn = await screen.findByText('Reset')
    expect(resetBtn).toBeDefined()
    fireEvent.click(resetBtn)

    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe('')
    })
  })

  it('shows empty state message when no results returned', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], total: 0, totalPages: 1 }),
    })
    render(<AgentsContent />)
    expect(await screen.findByText('No agents match your filters.')).toBeDefined()
  })

  it('shows result count', async () => {
    render(<AgentsContent />)
    expect(await screen.findByText(`${MOCK_RESULTS.length} agents found`)).toBeDefined()
  })
})
