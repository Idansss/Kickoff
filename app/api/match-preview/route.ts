import { NextRequest, NextResponse } from 'next/server'
import { createAnthropicMessage } from '@/lib/anthropic'
import { USER_MESSAGES } from '@/lib/constants'

const SYSTEM_PROMPT =
  'You are a football journalist. Write a 2-sentence match preview covering the key tactical battle and your result prediction.'

interface MatchPreviewRequestBody {
  home?: string
  away?: string
  competition?: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as MatchPreviewRequestBody
  const home = body.home?.trim() ?? ''
  const away = body.away?.trim() ?? ''
  const competition = body.competition?.trim() ?? ''

  if (!home || !away || !competition) {
    return NextResponse.json(
      { error: 'home, away and competition are required' },
      { status: 400 }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      preview: `${home} vs ${away} in ${competition}: expect a tactical midfield battle and fine margins. Prediction: 2-1 home win.`,
    })
  }

  try {
    const preview = await createAnthropicMessage({
      apiKey,
      maxTokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Preview: ${home} vs ${away} in ${competition}` }],
    })

    return NextResponse.json({ preview })
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.connectionError }, { status: 503 })
  }
}
