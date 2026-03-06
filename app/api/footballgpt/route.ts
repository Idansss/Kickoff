import { NextRequest, NextResponse } from 'next/server'
import { createAnthropicMessage } from '@/lib/anthropic'
import { createXaiMessage } from '@/lib/xai'
import { INPUT_LIMITS, USER_MESSAGES } from '@/lib/constants'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const SYSTEM_PROMPT = `You are FootballGPT, an expert football analyst and commentator with deep knowledge of:
- Tactics, formations, and game strategy
- Player statistics, performance analysis, and scouting
- Transfer market, club finances, and squad building
- Historical records and football trivia
- All major leagues: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League

Respond with expert insight, clear analysis, and engaging commentary. Keep responses concise and impactful (2-4 paragraphs max). Use specific statistics and examples when relevant. Use markdown for headings and emphasis (**bold**, *italic*) where it helps.`

interface FootballGptHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

interface FootballGptRequestBody {
  message?: string
  history?: readonly FootballGptHistoryItem[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req.headers)
  const { success } = rateLimit(`footballgpt:${ip}`, { limit: 30, windowMs: 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a moment.' }, { status: 429 })
  }

  const body = (await req.json()) as FootballGptRequestBody
  const message = body.message?.trim() ?? ''
  const history = body.history ?? []

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (message.length > INPUT_LIMITS.aiMessageMaxLength) {
    return NextResponse.json(
      { error: `Message must be ${INPUT_LIMITS.aiMessageMaxLength} characters or fewer` },
      { status: 400 }
    )
  }

  const messages = [...history, { role: 'user' as const, content: message }]
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const xaiKey = process.env.XAI_API_KEY

  if (!anthropicKey && !xaiKey) {
    return NextResponse.json({
      reply:
        "FootballGPT is ready, but no AI keys are configured. Add ANTHROPIC_API_KEY and/or XAI_API_KEY in your environment.",
    })
  }

  const results = await Promise.allSettled([
    anthropicKey
      ? createAnthropicMessage({
          apiKey: anthropicKey,
          maxTokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
        })
      : Promise.resolve(''),
    xaiKey
      ? createXaiMessage({
          apiKey: xaiKey,
          maxTokens: 1024,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        })
      : Promise.resolve(''),
  ])

  const claudeReply = results[0].status === 'fulfilled' ? results[0].value : ''
  const xaiReply = results[1].status === 'fulfilled' ? results[1].value : ''

  const parts: string[] = []
  if (claudeReply.trim()) parts.push(claudeReply.trim())
  if (xaiReply.trim()) parts.push(xaiReply.trim())

  if (parts.length === 0) {
    return NextResponse.json({ error: USER_MESSAGES.connectionError }, { status: 503 })
  }

  const reply = parts.length === 2
    ? `${parts[0]}\n\n---\n\n${parts[1]}`
    : parts[0]

  return NextResponse.json({ reply })
}
