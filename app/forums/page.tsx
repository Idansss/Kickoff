import { Suspense } from 'react'
import Link from 'next/link'
import { ForumCategoriesContent } from '@/components/football/forum/ForumCategoriesContent'
import { AppLayout } from '@/components/app-layout'
import { PageShell } from '@/components/shared/PageShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Forums · KICKOFF',
  description: 'Discuss football, transfers, tactics, and more.',
}

export default function ForumsPage() {
  return (
    <AppLayout>
      <PageShell
        title="Forums"
        description="Discuss the beautiful game — transfers, tactics, matchday reactions, and more."
        header={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/forums/search"
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              🔍 Search threads
            </Link>
          </div>
        }
      >
        <div className="mx-auto w-full max-w-3xl">
          <Suspense
            fallback={
              <div className="grid gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted" />
                ))}
              </div>
            }
          >
            <ForumCategoriesContent />
          </Suspense>
        </div>
      </PageShell>
    </AppLayout>
  )
}
