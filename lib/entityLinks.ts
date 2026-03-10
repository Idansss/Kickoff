import { mockPlayers, mockClubs } from '@/lib/mock-data'

export function getPlayerHrefByName(name: string): string | null {
  const normalized = name.trim().toLowerCase()
  const player = mockPlayers.find((p) => p.name.toLowerCase() === normalized)
  return player ? `/player/${player.id}` : null
}

export function getClubHrefByName(name: string): string {
  const normalized = name.trim().toLowerCase()
  const club = mockClubs.find((c) => c.name.toLowerCase() === normalized)
  return club ? `/club/${club.id}` : `/search?q=${encodeURIComponent(name)}&type=teams`
}

