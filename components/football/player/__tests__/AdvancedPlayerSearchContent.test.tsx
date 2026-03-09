import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdvancedPlayerSearchContent } from '../AdvancedPlayerSearchContent'

vi.mock('next/navigation', () => {
  const params = new URLSearchParams()
  return {
    useSearchParams: () => params,
    useRouter: () => ({
      replace: vi.fn(),
    }),
  }
})

// simple fetch mock that returns empty result set
beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [], total: 0, totalPages: 1 }),
  } as any)
})

afterAll(() => {
  // @ts-expect-error - restore
  delete global.fetch
})

describe('AdvancedPlayerSearchContent', () => {
  it('renders filters and updates filter state on input change', async () => {
    render(<AdvancedPlayerSearchContent />)

    const nationalityInput = await screen.findByPlaceholderText('England, Brazil…')
    fireEvent.change(nationalityInput, { target: { value: 'England' } })

    await waitFor(() => {
      expect((nationalityInput as HTMLInputElement).value).toBe('England')
    })
  })
})


