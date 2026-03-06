import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const mapped = transfers.map((t) => ({
      id: t.id,
      player: t.player.name,
      fromTeam: t.fromTeam?.name ?? 'Unknown',
      toTeam: t.toTeam?.name ?? 'Unknown',
      fee: t.fee ?? 'N/A',
      type: (t.type as 'confirmed' | 'rumour' | 'done') ?? 'rumour',
      date: t.date?.toISOString().slice(0, 10) ?? '',
      credibility: (t.metaJson as { credibility?: number } | null)?.credibility,
      source: (t.metaJson as { source?: string } | null)?.source,
    }))

    return NextResponse.json(mapped)
  } catch {
    return NextResponse.json([])
  }
}
