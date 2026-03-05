import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANTHROPIC, ROUTES, USER_MESSAGES } from '@/lib/constants'
import { askFootballGPT, getScoutReport } from '@/lib/claudeClient'

describe('claudeClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('sends expected payload for askFootballGPT', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'Great answer' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await askFootballGPT('Who wins the league?')

    expect(response).toBe('Great answer')
    expect(fetchMock).toHaveBeenCalledWith(
      ROUTES.footballGpt,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(request.body as string)).toEqual({
      message: 'Who wins the league?',
      history: [],
    })
  })

  it('sends expected payload for getScoutReport', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ report: 'Scout report' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await getScoutReport('Erling Haaland', 'Manchester City')
    expect(response).toBe('Scout report')

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(request.body as string)).toEqual({
      player: {
        name: 'Erling Haaland',
        club: { name: 'Manchester City' },
        position: 'Player',
        number: 0,
      },
    })
  })

  it('returns user-facing error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')))

    const response = await askFootballGPT('Hello?')
    expect(response).toBe(USER_MESSAGES.connectionError)
  })

  it('aborts in-flight request after timeout', async () => {
    vi.useFakeTimers()
    const seenSignals: AbortSignal[] = []

    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal
      seenSignals.push(signal)

      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const requestPromise = askFootballGPT('Will this timeout?')
    await vi.advanceTimersByTimeAsync(
      ANTHROPIC.timeoutMs + ANTHROPIC.retryDelayMs + ANTHROPIC.timeoutMs + 100
    )
    const response = await requestPromise

    expect(response).toBe(USER_MESSAGES.timeoutError)
    expect(seenSignals.length).toBe(2)
    expect(seenSignals.every((signal) => signal.aborted)).toBe(true)
  })
})
