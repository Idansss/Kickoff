import Link from 'next/link'

export interface NewsCardProps {
  item: {
    id: string
    title: string
    summary?: string
    source?: string
    url?: string
    imageUrl?: string
    publishedAt: string
    teamId?: string
    competitionId?: string
  }
}

export function NewsCard({ item }: NewsCardProps) {
  const published = new Date(item.publishedAt)
  const timeLabel = published.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const content = (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 hover:bg-muted/60 transition-colors">
      <header>
        <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
        {item.summary ? (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{item.summary}</p>
        ) : null}
      </header>
      <footer className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{item.source ?? 'Kickoff News'}</span>
        <span>{timeLabel}</span>
      </footer>
    </article>
  )

  if (item.url) {
    return (
      <Link href={item.url} target="_blank" rel="noreferrer" className="block">
        {content}
      </Link>
    )
  }

  return content
}

