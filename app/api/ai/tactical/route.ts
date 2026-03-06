import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = rateLimit(`tactical:${ip}`, { limit: 20, windowMs: 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
  }
  const { matchId, homeTeam, awayTeam, formation, question } = await request.json() as {
    matchId?: string
    homeTeam?: string
    awayTeam?: string
    formation?: string
    question: string
  }

  const context = [homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : null, formation ? `Formation: ${formation}` : null]
    .filter(Boolean)
    .join('. ')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are an expert football tactical analyst.${context ? ` Context: ${context}.` : ''}

Question: ${question}

Give a clear, insightful tactical analysis. Use concrete football terminology.
Be specific about positioning, pressing triggers, and attacking/defensive principles.
Keep it to 3-4 concise paragraphs.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ analysis: text })
  } catch {
    return NextResponse.json({
      analysis: `This is a fascinating tactical question. ${homeTeam ?? 'The home side'} typically sets up in a compact mid-block, inviting pressure before transitioning quickly with vertical passes into the striker's feet.

Against ${awayTeam ?? 'the opposition'}, the key battle will be in the central midfield zone — whichever side controls the half-spaces will create the most dangerous chances. High pressing from the front three could force errors in the build-up.

From a defensive structure perspective, the back four should maintain a narrow shape, collapsing centrally when the ball goes wide, then recovering their block shape quickly after winning possession.`,
    })
  }
}
