import { NextResponse } from 'next/server'
import { z } from 'zod'
import { footballService } from '@/lib/football/service'

const CalendarQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  competitionId: z.string().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const parseResult = CalendarQuerySchema.safeParse({
    date: url.searchParams.get('date'),
    competitionId: url.searchParams.get('competitionId') ?? undefined,
  })

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parseResult.error.flatten() },
      { status: 400 },
    )
  }

  const { date, competitionId } = parseResult.data
  const matches = await footballService.matchesByDate(date, competitionId ?? null)

  return NextResponse.json({ matches })
}

