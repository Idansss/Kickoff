import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = rateLimit(`transfer-rumour:${ip}`, { limit: 15, windowMs: 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
  }

  const { rumour } = await request.json() as { rumour: string }

  if (!rumour?.trim()) {
    return NextResponse.json({ error: 'No rumour provided' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are a football transfer analyst. Analyse this transfer rumour and provide:
1. A credibility score from 1-10 with a short explanation
2. Key factors supporting or refuting it
3. Your verdict (Likely / Unlikely / Too Early)

Rumour: "${rumour}"

Respond in JSON format:
{
  "score": number,
  "scoreLabel": "string like 'Credible' / 'Possible' / 'Unlikely'",
  "factors": ["factor1", "factor2", "factor3"],
  "verdict": "Likely" | "Unlikely" | "Too Early",
  "analysis": "2-3 sentence analysis"
}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({
      score: 5,
      scoreLabel: 'Possible',
      factors: ['Source credibility unknown', 'Player form relevant', 'Club finances factor'],
      verdict: 'Too Early',
      analysis: 'This rumour requires more verified sources before a credibility assessment can be made.',
    })
  }
}
