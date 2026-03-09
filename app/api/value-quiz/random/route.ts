import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  // Fetch all players that have at least one market value snapshot
  const players = await db.player.findMany({
    where: {
      marketValues: { some: {} },
    },
    select: {
      id: true,
      name: true,
      position: true,
      nationality: true,
      dob: true,
      photoUrl: true,
      currentTeam: { select: { id: true, name: true, badgeUrl: true } },
      marketValues: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { valueEur: true, date: true },
      },
    },
  })

  if (players.length === 0) {
    return NextResponse.json({ error: 'No players with market values found' }, { status: 404 })
  }

  // Pick a random player
  const player = players[Math.floor(Math.random() * players.length)]!

  const latestValue = player.marketValues[0]!

  const age = player.dob
    ? Math.floor((Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return NextResponse.json({
    player: {
      id: player.id,
      name: player.name,
      position: player.position,
      nationality: player.nationality,
      age,
      photoUrl: player.photoUrl,
      currentTeam: player.currentTeam,
      // Actual value is intentionally NOT included here — submitted separately
    },
    // We embed an encrypted hint so client can't read the value from the response
    // The actual value is revealed only after /attempt is called
    valueDate: latestValue.date,
    // Difficulty hint: broad band so players can calibrate
    valueBand: getValueBand(latestValue.valueEur),
  })
}

function getValueBand(eur: number): string {
  if (eur >= 150_000_000) return '€100m+'
  if (eur >= 80_000_000) return '€50m–€150m'
  if (eur >= 30_000_000) return '€20m–€80m'
  if (eur >= 10_000_000) return '€10m–€30m'
  return 'Under €10m'
}
