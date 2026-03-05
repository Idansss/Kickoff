import { beforeEach, describe, expect, it } from 'vitest'
import { mockNotifications, mockUsers } from '@/data/mockData'
import { feedStore } from '@/store/feedStore'
import { userStore } from '@/store/userStore'

function resetUserStore(): void {
  userStore.setState({
    currentUser: {
      ...mockUsers[0],
      xp: 0,
      level: 1,
      streak: 0,
      badges: [],
    },
    notifications: mockNotifications,
  })
}

describe('feedStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserStore()
    feedStore.setState({ posts: [], bookmarks: [] })
    feedStore.getState().initPosts()
  })

  it('addPost prepends post with correct author and content', () => {
    const previousPosts = feedStore.getState().posts
    const content = 'Hello football world #PL'

    feedStore.getState().addPost(content, 'PL')

    const nextPosts = feedStore.getState().posts
    expect(nextPosts).toHaveLength(previousPosts.length + 1)
    expect(nextPosts[0].author.id).toBe(userStore.getState().currentUser.id)
    expect(nextPosts[0].content).toBe(content)
  })

  it('toggleLike increments then decrements likes', () => {
    const postId = feedStore.getState().posts[0].id
    const initialLikes = feedStore.getState().posts[0].likes

    feedStore.getState().toggleLike(postId)
    expect(feedStore.getState().posts[0].likes).toBe(initialLikes + 1)

    feedStore.getState().toggleLike(postId)
    expect(feedStore.getState().posts[0].likes).toBe(initialLikes)
  })

  it('toggleBookmark adds post to bookmarks', () => {
    const postId = feedStore.getState().posts[0].id

    feedStore.getState().toggleBookmark(postId)

    expect(feedStore.getState().bookmarks.some((post) => post.id === postId)).toBe(true)
  })

  it('votePoll increments selected option and total votes', () => {
    const pollPost = feedStore.getState().posts.find((post) => post.poll)
    expect(pollPost).toBeDefined()
    if (!pollPost?.poll) return

    const optionId = pollPost.poll.options[0].id
    const initialVotes = pollPost.poll.options[0].votes
    const initialTotal = pollPost.poll.totalVotes

    feedStore.getState().votePoll(pollPost.id, optionId)

    const updatedPoll = feedStore.getState().posts.find((post) => post.id === pollPost.id)?.poll
    expect(updatedPoll).toBeDefined()
    if (!updatedPoll) return

    const updatedOption = updatedPoll.options.find((option) => option.id === optionId)
    expect(updatedOption?.votes).toBe(initialVotes + 1)
    expect(updatedPoll.totalVotes).toBe(initialTotal + 1)

    const recalculated = Math.round(((updatedOption?.votes ?? 0) / updatedPoll.totalVotes) * 100)
    expect(recalculated).toBeGreaterThan(0)
  })

  it('votePoll prevents double voting on same poll', () => {
    const pollPost = feedStore.getState().posts.find((post) => post.poll)
    expect(pollPost).toBeDefined()
    if (!pollPost?.poll) return

    const optionId = pollPost.poll.options[0].id
    feedStore.getState().votePoll(pollPost.id, optionId)
    const afterFirstVote = feedStore.getState().posts.find((post) => post.id === pollPost.id)?.poll
    expect(afterFirstVote).toBeDefined()
    if (!afterFirstVote) return

    feedStore.getState().votePoll(pollPost.id, optionId)
    const afterSecondVote = feedStore.getState().posts.find((post) => post.id === pollPost.id)?.poll

    expect(afterSecondVote?.totalVotes).toBe(afterFirstVote.totalVotes)
    expect(afterSecondVote?.options[0].votes).toBe(afterFirstVote.options[0].votes)
  })
})
