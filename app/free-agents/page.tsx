import { Suspense } from 'react'
import { FreeAgentsContent } from '@/components/football/player/FreeAgentsContent'

export const dynamic = 'force-dynamic'

export default function FreeAgentsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Free agents</h1>
        <p className="text-sm text-muted-foreground">
          Explore players currently without a club, filtered by position, nationality, value, and more.
        </p>
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading free agents…</div>}>
        <FreeAgentsContent />
      </Suspense>
    </main>
  )
}

