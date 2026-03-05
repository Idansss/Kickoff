import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Post, Reply } from '@/types'
import { mockUsers, buildMockPosts } from '@/data/mockData'
import { INPUT_LIMITS, STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'
import { userStore } from './userStore'

function extractTags(content: string, marker: '#' | '@'): string[] {
  const regex = marker === '#' ? /#\w+/g : /@\w+/g
  return (content.match(regex) ?? []).map((part) => part.slice(1))
}

export interface TrendingTopic {
  tag: string
  count: number
}

export interface FeedState {
  posts: readonly Post[]
  bookmarks: readonly Post[]
  pendingPostCount: number
  mutedUsers: string[]
  blockedUsers: string[]
  hiddenPosts: string[]
  initPosts: () => void
  addPost: (content: string, tag: Post['tag'], poll?: Post['poll'], images?: string[]) => void
  flushPendingPosts: () => void
  addPendingPostsSimulation: (amount?: number) => void
  muteUser: (handle: string) => void
  blockUser: (userId: string) => void
  hidePost: (postId: string) => void
  toggleLike: (postId: string) => void
  toggleBookmark: (postId: string) => void
  votePoll: (postId: string, optionId: string) => void
  addQuotePost: (quotedPostId: string, content: string) => void
  addReply: (postId: string, content: string) => void
  repostPost: (postId: string) => void
  undoRepost: (postId: string) => void
  toggleReplyLike: (postId: string, replyId: string) => void
  getTrendingTopics: () => TrendingTopic[]
}

export const feedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      posts: [],
      bookmarks: [],
      pendingPostCount: 0,
      mutedUsers: [],
      blockedUsers: [],
      hiddenPosts: [],

      initPosts: (): void => {
        const posts = buildMockPosts(mockUsers)
        set({ posts })
      },

      addPost: (content, tag, poll, images): void => {
        const currentUser = userStore.getState().currentUser
        const normalizedContent = content.trim()
        if (
          !currentUser ||
          normalizedContent.length === 0 ||
          normalizedContent.length > INPUT_LIMITS.postMaxLength
        ) {
          return
        }

        const newPost: Post = {
          id: `post-${Date.now()}`,
          author: currentUser,
          content: normalizedContent,
          hashtags: extractTags(normalizedContent, '#'),
          mentions: extractTags(normalizedContent, '@'),
          tag,
          likes: 0,
          comments: 0,
          reposts: 0,
          bookmarked: false,
          likedByMe: false,
          poll,
          createdAt: new Date(),
          images: images?.length ? images.slice(0, 4) : undefined,
        }
        set((s) => ({ posts: [newPost, ...s.posts] }))
        userStore.getState().addXP(50)
        userStore.getState().awardBadgeIfFirstPost()
      },

      flushPendingPosts: (): void => {
        set({ pendingPostCount: 0 })
      },

      addPendingPostsSimulation: (amount): void => {
        const n = amount ?? Math.floor(1 + Math.random() * 4)
        set((s) => ({ pendingPostCount: s.pendingPostCount + n }))
      },

      muteUser: (handle): void => {
        const h = handle.trim().replace(/^@/, '')
        if (!h) return
        set((s) => ({
          mutedUsers: s.mutedUsers.includes(h) ? s.mutedUsers : [...s.mutedUsers, h],
        }))
      },

      blockUser: (userId): void => {
        if (!userId) return
        set((s) => ({
          blockedUsers: s.blockedUsers.includes(userId) ? s.blockedUsers : [...s.blockedUsers, userId],
        }))
        set((s) => ({
          posts: s.posts.filter((p) => p.author.id !== userId),
        }))
      },

      hidePost: (postId): void => {
        if (!postId) return
        set((s) => ({
          hiddenPosts: s.hiddenPosts.includes(postId) ? s.hiddenPosts : [...s.hiddenPosts, postId],
        }))
      },

      getTrendingTopics: (): TrendingTopic[] => {
        const posts = get().posts
        const countByTag = new Map<string, number>()
        for (const post of posts) {
          for (const tag of post.hashtags ?? []) {
            const key = tag.startsWith('#') ? tag : `#${tag}`
            countByTag.set(key, (countByTag.get(key) ?? 0) + 1)
          }
        }
        return Array.from(countByTag.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      },

      toggleLike: (postId): void => {
        set((s) => {
          const next = s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likedByMe: !p.likedByMe,
                  likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
                }
              : p
          )
          const currentUser = userStore.getState().currentUser
          if (!currentUser) {
            return { posts: next }
          }
          const totalLikesReceived = next
            .filter((p) => p.author.id === currentUser.id)
            .reduce((sum, p) => sum + p.likes, 0)
          if (totalLikesReceived >= 10) {
            userStore.getState().awardBadgeIf10Likes(totalLikesReceived)
          }
          return { posts: next }
        })
      },

      toggleBookmark: (postId): void => {
        set((s) => {
          const post = s.posts.find((p) => p.id === postId)
          if (!post) return s
          const nextBookmarked = !post.bookmarked
          const nextPost = { ...post, bookmarked: nextBookmarked }
          const nextPosts = s.posts.map((p) => (p.id === postId ? nextPost : p))
          const nextBookmarks = nextBookmarked
            ? [nextPost, ...s.bookmarks]
            : s.bookmarks.filter((b) => b.id !== postId)
          return { posts: nextPosts, bookmarks: nextBookmarks }
        })
      },

      votePoll: (postId, optionId): void => {
        set((s) => {
          const post = s.posts.find((item) => item.id === postId)
          const poll = post?.poll
          if (!post || !poll || poll.votedOptionId) {
            return s
          }

          const targetOption = poll.options.find((option) => option.id === optionId)
          if (!targetOption) {
            return s
          }

          const options = poll.options.map((option) =>
            option.id === optionId ? { ...option, votes: option.votes + 1 } : option
          )
          const totalVotes = poll.totalVotes + 1

          return {
            posts: s.posts.map((item) =>
              item.id === postId
                ? {
                    ...item,
                    poll: {
                      ...poll,
                      options,
                      totalVotes,
                      votedOptionId: optionId,
                    },
                  }
                : item
            ),
          }
        })
      },

      addQuotePost: (quotedPostId, content): void => {
        const quoted = get().posts.find((p) => p.id === quotedPostId)
        const currentUser = userStore.getState().currentUser
        const normalizedContent = content.trim()
        if (
          !quoted ||
          !currentUser ||
          normalizedContent.length === 0 ||
          normalizedContent.length > INPUT_LIMITS.postMaxLength
        ) {
          return
        }

        const newPost: Post = {
          id: `post-${Date.now()}`,
          author: currentUser,
          content: normalizedContent,
          hashtags: extractTags(normalizedContent, '#'),
          mentions: extractTags(normalizedContent, '@'),
          tag: 'General',
          likes: 0,
          comments: 0,
          reposts: 0,
          bookmarked: false,
          likedByMe: false,
          quotedPost: quoted,
          createdAt: new Date(),
        }
        set((s) => ({
          posts: [
            newPost,
            ...s.posts.map((p) =>
              p.id === quotedPostId ? { ...p, reposts: (p.reposts ?? 0) + 1 } : p
            ),
          ],
        }))
        userStore.getState().addXP(20)
      },

      addReply: (postId, content): void => {
        const currentUser = userStore.getState().currentUser
        const normalizedContent = content.trim()
        if (!currentUser || normalizedContent.length === 0) return
        if (normalizedContent.length > INPUT_LIMITS.postMaxLength) return

        const reply: Reply = {
          id: `reply-${Date.now()}`,
          author: currentUser,
          content: normalizedContent,
          createdAt: new Date(),
          likes: 0,
          likedByMe: false,
        }
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  replies: [...(p.replies ?? []), reply],
                  comments: (p.comments ?? 0) + 1,
                }
              : p
          ),
        }))
        userStore.getState().addXP(10)
      },

      repostPost: (postId): void => {
        const post = get().posts.find((p) => p.id === postId)
        const currentUser = userStore.getState().currentUser
        if (!post || !currentUser || post.repostedByMe) return

        const copy: Post = {
          ...post,
          id: `repost-${Date.now()}`,
          repostOfPostId: post.id,
          repostedBy: currentUser.id,
        }
        set((s) => ({
          posts: [copy, ...s.posts.map((p) =>
            p.id === postId
              ? { ...p, repostedByMe: true, reposts: (p.reposts ?? 0) + 1 }
              : p
          )],
        }))
      },

      undoRepost: (postId): void => {
        const currentUser = userStore.getState().currentUser
        if (!currentUser) return

        set((s) => {
          const original = s.posts.find((p) => p.id === postId)
          if (!original || !original.repostedByMe) return s
          const nextPosts = s.posts.filter(
            (p) => !(p.repostOfPostId === postId && p.repostedBy === currentUser.id)
          )
          return {
            posts: nextPosts.map((p) =>
              p.id === postId
                ? { ...p, repostedByMe: false, reposts: Math.max(0, (p.reposts ?? 0) - 1) }
                : p
            ),
          }
        })
      },

      toggleReplyLike: (postId, replyId): void => {
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id !== postId || !p.replies
              ? p
              : {
                  ...p,
                  replies: p.replies.map((r) =>
                    r.id !== replyId
                      ? r
                      : {
                          ...r,
                          likedByMe: !r.likedByMe,
                          likes: r.likedByMe ? r.likes - 1 : r.likes + 1,
                        }
                  ),
                }
          ),
        }))
      },
    }),
    {
      name: STORE_KEYS.feed,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        posts: state.posts,
        bookmarks: state.bookmarks,
        mutedUsers: state.mutedUsers,
        blockedUsers: state.blockedUsers,
        hiddenPosts: state.hiddenPosts,
      }),
    }
  )
)
