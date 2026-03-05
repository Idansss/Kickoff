import { NextRequest, NextResponse } from 'next/server'
import { createAnthropicMessage } from '@/lib/anthropic'
import { USER_MESSAGES } from '@/lib/constants'

interface ScoutPlayer {
  name: string
  position?: string
  age?: number
  nationality?: string
  number?: number
  stats?: {
    appearances?: number
    goals?: number
    assists?: number
  }
  club?: {
    name?: string
  }
}

interface ScoutRequestBody {
  player?: ScoutPlayer
}

function getFallbackReport(player: ScoutPlayer): string {
  return [
    `Scout Report: ${player.name}`,
    '',
    `Strengths: ${player.name} is a high-impact ${player.position ?? 'player'} with strong technical quality and game intelligence.`,
    `Development Areas: Prioritize consistency under pressure and off-ball defensive transitions.`,
    `Projection: A high-upside profile who can improve elite squads in the right tactical system.`,
  ].join('\n')
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as ScoutRequestBody
  const player = body.player

  if (!player?.name?.trim()) {
    return NextResponse.json({ error: 'Player data is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ report: getFallbackReport(player) })
  }

  const prompt = `Generate a professional football scout report for the following player:

Name: ${player.name}
Age: ${player.age ?? 'Unknown'}
Nationality: ${player.nationality ?? 'Unknown'}
Position: ${player.position ?? 'Unknown'}
Club: ${player.club?.name ?? 'Unknown'}
Jersey Number: #${player.number ?? 'Unknown'}

Season Statistics:
- Appearances: ${player.stats?.appearances ?? 0}
- Goals: ${player.stats?.goals ?? 0}
- Assists: ${player.stats?.assists ?? 0}

Write a 3-paragraph professional scouting report covering:
1. Strengths
2. Weaknesses and areas for development
3. Overall assessment and transfer value

Be specific, analytical, and professional.`

  try {
    const report = await createAnthropicMessage({
      apiKey,
      maxTokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    return NextResponse.json({ report })
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.connectionError }, { status: 503 })
  }
}
