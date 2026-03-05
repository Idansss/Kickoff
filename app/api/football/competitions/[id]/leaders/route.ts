import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

// Placeholder implementation: return empty arrays with the correct shape.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid competition id' }, { status: 400 })
  }

  return NextResponse.json({
    topScorers: [],
    topAssists: [],
    topRatings: [],
  })
}

