import { Suspense } from 'react'
import { ValueQuizContent } from '@/components/football/value-quiz/ValueQuizContent'

export const metadata = {
  title: 'Guess the Value · KICKOFF',
  description: 'Test your Transfermarkt knowledge — guess player market values and score points.',
}

export default function ValueQuizPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Guess the Value</h1>
        <p className="text-sm text-muted-foreground">
          How well do you know player market values? Guess closer, score higher.
        </p>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border bg-muted" />}>
        <ValueQuizContent />
      </Suspense>
    </main>
  )
}
