'use client'

import { PostComposerModal, RepostToast } from '@/components/NewComponents'
import { uiStore } from '@/store/uiStore'
import { toastStore } from '@/store/toastStore'
import { feedStore } from '@/store/feedStore'
import { userStore } from '@/store/userStore'
import type { Post } from '@/types'

const TAG_MAP: Record<string, Post['tag']> = {
  General: 'General',
  PL: 'PL',
  UCL: 'UCL',
  Transfer: 'Transfer',
  Stats: 'Stats',
  'Serie A': 'SerieA',
  'La Liga': 'LaLiga',
}

function mapTag(tag: string): Post['tag'] {
  return TAG_MAP[tag] ?? 'General'
}

export function GlobalModals() {
  const isPostModalOpen = uiStore((s) => s.isPostModalOpen)
  const closePostModal = uiStore((s) => s.closePostModal)
  const activeToast = toastStore((s) => s.activeToast)
  const hideToast = toastStore((s) => s.hideToast)
  const addPost = feedStore((s) => s.addPost)

  const handlePost = (data: { text: string; tags: string[]; images?: string[] }) => {
    const content = data.text.trim()
    const tag = data.tags?.[0] ? mapTag(data.tags[0]) : 'General'
    addPost(content, tag, undefined, data.images)
    closePostModal()
    toastStore.getState().showToast({ message: '✓ Posted!', duration: 3000 })
  }

  return (
    <>
      <PostComposerModal
        isOpen={isPostModalOpen}
        onClose={closePostModal}
        onPost={handlePost}
      />

      {activeToast && (
        <RepostToast
          onUndo={
            activeToast.undoAction
              ? () => {
                  activeToast.undoAction()
                  hideToast()
                  toastStore.getState().showToast({
                    message: '↩ Repost undone',
                    duration: 3000,
                  })
                }
              : undefined
          }
          onDismiss={hideToast}
          message={activeToast.message}
          duration={activeToast.duration}
        />
      )}
    </>
  )
}
