/**
 * xAI (Grok) client for FootballGPT.
 * Uses OpenAI-compatible Chat Completions API.
 */

import { XAI } from '@/lib/constants'

type XaiRole = 'system' | 'user' | 'assistant'

interface XaiMessage {
  role: XaiRole
  content: string
}

interface CreateXaiMessageArgs {
  apiKey: string
  messages: readonly XaiMessage[]
  maxTokens: number
  system?: string
}

interface XaiChoice {
  message?: { role?: string; content?: string }
  text?: string
}

interface XaiChatResponse {
  choices?: readonly XaiChoice[]
  error?: { message?: string }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function withTimeout(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    cancel: (): void => {
      clearTimeout(timeout)
    },
  }
}

async function requestXaiOnce(args: CreateXaiMessageArgs): Promise<XaiChatResponse> {
  const { signal, cancel } = withTimeout(XAI.timeoutMs)
  const messages = args.system
    ? [{ role: 'system' as const, content: args.system }, ...args.messages]
    : [...args.messages]

  try {
    const response = await fetch(XAI.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        model: XAI.model,
        max_tokens: args.maxTokens,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal,
    })

    const data = (await response.json()) as XaiChatResponse

    if (!response.ok) {
      throw new Error(data.error?.message ?? `xAI request failed with status ${response.status}`)
    }

    return data
  } finally {
    cancel()
  }
}

export async function createXaiMessage(args: CreateXaiMessageArgs): Promise<string> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= XAI.maxRetries; attempt += 1) {
    try {
      const data = await requestXaiOnce(args)
      const choice = data.choices?.[0]
      const content =
        choice?.message?.content ?? (choice as { text?: string })?.text ?? ''
      return content.trim()
    } catch (error) {
      lastError = error
      if (attempt < XAI.maxRetries) {
        await delay(XAI.retryDelayMs)
      }
    }
  }

  throw lastError ?? new Error('xAI request failed')
}
