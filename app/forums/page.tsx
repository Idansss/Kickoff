import { Suspense } from 'react'
import Link from 'next/link'
import { ForumCategoriesContent } from '@/components/football/forum/ForumCategoriesContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Forums · KICKOFF',
  description: 'Discuss football, transfers, tactics, and more.',
}

export default function ForumsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Forums</h1>
          <Link
            href="/forums/search"
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
          >
            🔍 Search threads
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Discuss the beautiful game — transfers, tactics, matchday reactions, and more.
        </p>
      </header>
      <Suspense fallback={
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      }>
        <ForumCategoriesContent />
      </Suspense>
    </main>
  )
}
