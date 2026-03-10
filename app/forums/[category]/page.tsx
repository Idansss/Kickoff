import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CategoryThreadsContent } from '@/components/football/forum/CategoryThreadsContent'

export const dynamic = 'force-dynamic'

async function fetchCategory(slug: string) {
  try {
    const { db } = await import('@/lib/db')
    return await db.forumCategory.findUnique({ where: { slug }, select: { name: true, description: true } })
  } catch { return null }
}

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: slug } = await params
  const cat = await fetchCategory(slug)
  return {
    title: cat ? `${cat.name} · Forums · KICKOFF` : 'Forums · KICKOFF',
    description: cat?.description ?? 'Browse and post threads.',
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params
  const cat = await fetchCategory(slug)
  if (!cat) notFound()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/forums" className="hover:underline">Forums</Link>
          <span>/</span>
          <span>{cat.name}</span>
        </nav>
        <h1 className="text-xl font-semibold">{cat.name}</h1>
        {cat.description && (
          <p className="text-sm text-muted-foreground">{cat.description}</p>
        )}
      </header>
      <Suspense fallback={
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      }>
        <CategoryThreadsContent categorySlug={slug} />
      </Suspense>
    </main>
  )
}
