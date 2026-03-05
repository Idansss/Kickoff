import { PlayerHeader } from '@/components/football/player/PlayerHeader'
import { PlayerTabs } from '@/components/football/player/PlayerTabs'

interface PlayerPageProps {
  params: {
    id: string
  }
}

async function fetchPlayer(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(`${base}/api/football/players/${id}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error('Player not found')
  }

  return (await res.json()) as {
    player: any
    transferStatus?: any
    value?: any
    recentForm?: any
  }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const data = await fetchPlayer(params.id)

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <PlayerHeader
        player={data.player}
        transferStatus={data.transferStatus}
        value={data.value}
        recentForm={data.recentForm}
      />
      <PlayerTabs playerId={params.id} />
    </main>
  )
}
