import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ThreadContent } from '@/components/football/forum/ThreadContent'

export const dynamic = 'force-dynamic'

async function fetchThreadMeta(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/forums/thread/${id}?pageSize=1`, { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) return null
  const json = (await res.json()) as {
    thread: { title: string; category: { slug: string; name: string } }
  }
  return json.thread
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const thread = await fetchThreadMeta(id)
  return {
    title: thread ? `${thread.title} · Forums · KICKOFF` : 'Thread · Forums · KICKOFF',
  }
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params
  const thread = await fetchThreadMeta(id)
  if (!thread) notFound()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <Suspense fallback={
        <div className="space-y-3">
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      }>
        <ThreadContent threadId={id} />
      </Suspense>
    </main>
  )
}
