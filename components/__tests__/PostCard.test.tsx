import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PostCard } from '@/components/post-card'
import type { LegacyPost } from '@/types'

const post: LegacyPost = {
  id: 'post-1',
  author: {
    id: 'u-1',
    name: 'Alex Turner',
    handle: 'alexturner',
    avatar: 'https://example.com/avatar.png',
    followers: 100,
    following: 50,
  },
  content: 'Haaland is unstoppable #Haaland',
  likes: 12,
  replies: 3,
  reposts: 5,
  shares: 1,
  createdAt: new Date('2026-03-04T10:00:00.000Z'),
}

describe('PostCard', () => {
  it('renders author name and handle', () => {
    render(<PostCard post={post} />)
    expect(screen.getByText('Alex Turner')).toBeInTheDocument()
    expect(screen.getByText('@alexturner')).toBeInTheDocument()
  })

  it('renders post content with hashtags highlighted', () => {
    render(<PostCard post={post} />)
    const hashtag = screen.getByText('#Haaland')
    expect(hashtag).toHaveClass('text-green-600')
  })

  it('like button click triggers onLike with postId', () => {
    const onLike = vi.fn()
    render(<PostCard post={post} onLike={onLike} />)

    fireEvent.click(screen.getByRole('button', { name: /like post/i }))
    expect(onLike).toHaveBeenCalledWith(post.id)
  })

  it('bookmark button click triggers onBookmark with postId', () => {
    const onBookmark = vi.fn()
    render(<PostCard post={post} onBookmark={onBookmark} />)

    fireEvent.click(screen.getByRole('button', { name: /bookmark post/i }))
    expect(onBookmark).toHaveBeenCalledWith(post.id)
  })
})
