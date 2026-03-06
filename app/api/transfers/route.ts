import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

export async function GET() {
  try {
    const transfers = await db.transfer.findMany({
      include: {
        player: true,
        fromTeam: true,
        toTeam: true,
      },
      orderBy: { date: 'desc' },
      take: 50,
    })

    const mapped = transfers.map((t) => {
      const meta = parseJson<{ credibility?: number; source?: string }>(t.metaJson)
      return {
        id: t.id,
        player: t.player.name,
        fromTeam: t.fromTeam?.name ?? 'Unknown',
        toTeam: t.toTeam?.name ?? 'Unknown',
        fee: t.fee ?? 'N/A',
        type: (t.type as 'confirmed' | 'rumour' | 'done') ?? 'rumour',
        date: t.date?.toISOString().slice(0, 10) ?? '',
        credibility: meta?.credibility,
        source: meta?.source,
      }
    })

    return NextResponse.json(mapped)
  } catch {
    return NextResponse.json([])
  }
}
