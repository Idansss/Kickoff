import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { footballService } from '@/lib/football/service'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid match id' }, { status: 400 })
  }

  const dto = await footballService.match(parsed.data.id)
  if (!dto) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Return full MatchDTO shape: match + events + lineups + stats
  return NextResponse.json(dto)
}

