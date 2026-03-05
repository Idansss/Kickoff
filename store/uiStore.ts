import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'

export interface UIStore {
  isPostModalOpen: boolean
  openPostModal: () => void
  closePostModal: () => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const uiStore = create<UIStore>()(
  persist(
    (set) => ({
      isPostModalOpen: false,
      openPostModal: () => set({ isPostModalOpen: true }),
      closePostModal: () => set({ isPostModalOpen: false }),
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: STORE_KEYS.ui,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
