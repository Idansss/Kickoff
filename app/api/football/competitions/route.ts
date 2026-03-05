import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const competitions = await db.competition.findMany({
    select: {
      id: true,
      name: true,
      country: true,
      type: true,
      logoUrl: true,
    },
    orderBy: { name: 'asc' },
  })

  const leagues = competitions.filter((c) => c.type === 'league')
  const cups = competitions.filter((c) => c.type === 'cup')
  const international = competitions.filter((c) => c.type === 'international')

  return NextResponse.json({
    leagues,
    cups,
    international,
  })
}

