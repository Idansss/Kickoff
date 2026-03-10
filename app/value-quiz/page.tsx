import { Suspense } from 'react'
import { ValueQuizContent } from '@/components/football/value-quiz/ValueQuizContent'
import { AppLayout } from '@/components/app-layout'
import { PageShell } from '@/components/shared/PageShell'
import Link from 'next/link'

export const metadata = {
  title: 'Guess the Value · KICKOFF',
  description: 'Test your Transfermarkt knowledge — guess player market values and score points.',
}

export default function ValueQuizPage() {
  return (
    <AppLayout>
      <PageShell
        title="Guess the Value"
        description="How well do you know player market values? Guess closer, score higher."
        header={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/market-values"
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              💰 Market values
            </Link>
          </div>
        }
      >
        <div className="mx-auto w-full max-w-lg">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border bg-muted" />}>
            <ValueQuizContent />
          </Suspense>
        </div>
      </PageShell>
    </AppLayout>
  )
}
