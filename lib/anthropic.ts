import { ANTHROPIC } from '@/lib/constants'

type AnthropicRole = 'user' | 'assistant'

interface AnthropicInputMessage {
  role: AnthropicRole
  content: string
}

interface AnthropicTextBlock {
  type: 'text'
  text: string
}

interface AnthropicMessageResponse {
  content: readonly AnthropicTextBlock[]
}

interface CreateAnthropicMessageArgs {
  apiKey: string
  messages: readonly AnthropicInputMessage[]
  maxTokens: number
  system?: string
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

async function requestAnthropicOnce(
  args: CreateAnthropicMessageArgs
): Promise<AnthropicMessageResponse> {
  const { signal, cancel } = withTimeout(ANTHROPIC.timeoutMs)

  try {
    const response = await fetch(ANTHROPIC.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': args.apiKey,
        'anthropic-version': ANTHROPIC.version,
      },
      body: JSON.stringify({
        model: ANTHROPIC.model,
        max_tokens: args.maxTokens,
        system: args.system,
        messages: args.messages,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`Anthropic request failed with status ${response.status}`)
    }

    return (await response.json()) as AnthropicMessageResponse
  } finally {
    cancel()
  }
}

export async function createAnthropicMessage(
  args: CreateAnthropicMessageArgs
): Promise<string> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= ANTHROPIC.maxRetries; attempt += 1) {
    try {
      const response = await requestAnthropicOnce(args)
      const firstTextBlock = response.content.find((block) => block.type === 'text')
      return firstTextBlock?.text?.trim() ?? ''
    } catch (error) {
      lastError = error
      if (attempt < ANTHROPIC.maxRetries) {
        await delay(ANTHROPIC.retryDelayMs)
      }
    }
  }

  throw lastError ?? new Error('Anthropic request failed')
}
