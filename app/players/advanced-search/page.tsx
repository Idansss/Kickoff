import { Suspense } from 'react'
import { AdvancedPlayerSearchContent } from '@/components/football/player/AdvancedPlayerSearchContent'

export const dynamic = 'force-dynamic'

export default function AdvancedPlayerSearchPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Advanced player search</h1>
        <p className="text-sm text-muted-foreground">
          Filter players by contract, market value, age, position, agent, and more.
        </p>
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading filters…</div>}>
        <AdvancedPlayerSearchContent />
      </Suspense>
    </main>
  )
}

