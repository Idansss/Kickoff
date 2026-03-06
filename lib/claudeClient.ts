/**
 * Client for FootballGPT and scout/preview APIs.
 * Calls app API routes to keep provider keys server-side.
 * Supports Claude and xAI (Grok).
 */

import type { AiProvider } from '@/lib/constants'
import { ANTHROPIC, ROUTES, USER_MESSAGES } from '@/lib/constants'

interface ApiResponseShape {
  reply?: string
  report?: string
  preview?: string
  error?: string
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function callApi(path: string, body: Record<string, unknown>): Promise<string> {
  let lastErrorMessage: string = USER_MESSAGES.connectionError

  for (let attempt = 0; attempt <= ANTHROPIC.maxRetries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ANTHROPIC.timeoutMs)

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const data = (await response.json()) as ApiResponseShape
      const payload =
        data.reply?.trim() || data.report?.trim() || data.preview?.trim() || data.error?.trim()

      if (response.ok) {
        return payload || USER_MESSAGES.genericError
      }

      lastErrorMessage = payload || USER_MESSAGES.connectionError
    } catch (error) {
      lastErrorMessage =
        error instanceof DOMException && error.name === 'AbortError'
          ? USER_MESSAGES.timeoutError
          : USER_MESSAGES.connectionError
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < ANTHROPIC.maxRetries) {
      await delay(ANTHROPIC.retryDelayMs)
    }
  }

  return lastErrorMessage
}

export async function askFootballGPT(
  question: string,
  options?: { provider?: AiProvider; history?: readonly { role: 'user' | 'assistant'; content: string }[] }
): Promise<string> {
  return callApi(ROUTES.footballGpt, {
    message: question,
    history: options?.history ?? [],
    provider: options?.provider ?? 'claude',
  })
}

export async function getScoutReport(playerName: string, club: string): Promise<string> {
  return callApi(ROUTES.scoutReport, {
    player: { name: playerName, club: { name: club }, position: 'Player', number: 0 },
  })
}

export async function getMatchPreview(
  home: string,
  away: string,
  competition: string
): Promise<string> {
  return callApi(ROUTES.matchPreview, { home, away, competition })
}
