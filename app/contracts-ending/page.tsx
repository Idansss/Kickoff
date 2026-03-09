import { Suspense } from 'react'
import { ContractsEndingContent } from '@/components/football/player/ContractsEndingContent'

export const dynamic = 'force-dynamic'

export default function ContractsEndingPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Contracts ending</h1>
        <p className="text-sm text-muted-foreground">
          See which players have contracts expiring soon, filtered by competition, club, position, and more.
        </p>
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading expiring contracts…</div>}>
        <ContractsEndingContent />
      </Suspense>
    </main>
  )
}

