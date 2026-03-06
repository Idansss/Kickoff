import { NextRequest, NextResponse } from 'next/server'
import { createAnthropicMessage } from '@/lib/anthropic'
import { createXaiMessage } from '@/lib/xai'
import type { AiProvider } from '@/lib/constants'
import { INPUT_LIMITS, USER_MESSAGES } from '@/lib/constants'

const SYSTEM_PROMPT = `You are FootballGPT, an expert football analyst and commentator with deep knowledge of:
- Tactics, formations, and game strategy
- Player statistics, performance analysis, and scouting
- Transfer market, club finances, and squad building
- Historical records and football trivia
- All major leagues: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League

Respond with expert insight, clear analysis, and engaging commentary. Keep responses concise and impactful (2-4 paragraphs max). Use specific statistics and examples when relevant.`

interface FootballGptHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

interface FootballGptRequestBody {
  message?: string
  history?: readonly FootballGptHistoryItem[]
  provider?: AiProvider
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as FootballGptRequestBody
  const message = body.message?.trim() ?? ''
  const history = body.history ?? []
  const provider = body.provider ?? 'claude'

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

  if (provider === 'xai') {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "FootballGPT is ready, but the xAI key is not configured yet. Add XAI_API_KEY in your local environment.",
      })
    }
    try {
      const reply = await createXaiMessage({
        apiKey,
        maxTokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      return NextResponse.json({ reply })
    } catch {
      return NextResponse.json({ error: USER_MESSAGES.connectionError }, { status: 503 })
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      reply:
        "FootballGPT is ready, but the AI key is not configured yet. Add ANTHROPIC_API_KEY in your local environment.",
    })
  }

  try {
    const reply = await createAnthropicMessage({
      apiKey,
      maxTokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.connectionError }, { status: 503 })
  }
}
