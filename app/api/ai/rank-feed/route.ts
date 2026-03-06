import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const client = new Anthropic()

interface PostSummary {
  id: string
  content: string
  likes: number
  reposts: number
  tag: string
  authorVerified: boolean
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = rateLimit(`rank-feed:${ip}`, { limit: 5, windowMs: 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await request.json() as {
    posts: PostSummary[]
    interests: string[]
  }

  const { posts, interests } = body

  if (!posts?.length) {
    return NextResponse.json({ rankedIds: [] })
  }

  // Only rank up to 50 posts to keep token usage reasonable
  const toRank = posts.slice(0, 50)
  const interestStr = interests?.length ? interests.join(', ') : 'general football'

  const prompt = `You are a football content feed ranker. Given a user interested in "${interestStr}", rank these posts by relevance and quality.

Posts (as JSON array):
${JSON.stringify(toRank.map((p) => ({
  id: p.id,
  content: p.content.slice(0, 120),
  likes: p.likes,
  reposts: p.reposts,
  tag: p.tag,
  verified: p.authorVerified,
})))}

Return ONLY a JSON array of post IDs in order from most to least relevant. Example: ["id1", "id3", "id2"]
Consider: relevance to user interests, engagement, content quality, verified authors.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/)
    const rankedIds = match ? JSON.parse(match[0]) as string[] : toRank.map((p) => p.id)

    // Append any posts not ranked by Claude at the end
    const rankedSet = new Set(rankedIds)
    const remaining = toRank.filter((p) => !rankedSet.has(p.id)).map((p) => p.id)

    return NextResponse.json({ rankedIds: [...rankedIds, ...remaining] })
  } catch {
    // Fallback: sort by engagement + verified
    const fallback = toRank
      .sort((a, b) => {
        const va = a.authorVerified ? 1 : 0
        const vb = b.authorVerified ? 1 : 0
        if (vb !== va) return vb - va
        return (b.likes + b.reposts * 2) - (a.likes + a.reposts * 2)
      })
      .map((p) => p.id)
    return NextResponse.json({ rankedIds: fallback })
  }
}
