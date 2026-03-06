import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = rateLimit(`hot-take:${ip}`, { limit: 10, windowMs: 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Slow down!' }, { status: 429 })
  }

  const { context } = await request.json() as { context?: string }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Generate a single spicy, controversial football hot take${context ? ` about: ${context}` : ''}.
It should be opinionated, debatable, and provoke discussion.
Keep it under 240 characters (tweet length).
No emojis. No qualifiers like "I think" or "arguably".
State it as bold fact.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ hotTake: text })
  } catch {
    const fallbacks = [
      'Messi was never as good as his stats suggest — his entire career was built around a system that would have made any talented forward look elite.',
      'The Premier League is only watched worldwide because of marketing, not quality. La Liga in the early 2010s had three times the footballing IQ.',
      'Penalty shootouts are not luck. The team that trains more specifically for them wins more. Every manager who says otherwise is making excuses.',
      'Pep Guardiola has never won a Champions League with a team he built himself. Both his UCL wins were on Ancelotti foundations.',
      'Defensive midfielders are the most overrated position in modern football. A high defensive line makes them redundant.',
    ]
    return NextResponse.json({ hotTake: fallbacks[Math.floor(Math.random() * fallbacks.length)] })
  }
}
