import { NewsCard } from './NewsCard'

export interface NewsListItem {
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

interface Props {
  items: NewsListItem[]
}

export function NewsCardList({ items }: Props) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <NewsCard item={item} />
        </li>
      ))}
    </ul>
  )
}

