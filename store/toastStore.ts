import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  undoAction?: () => void
  duration: number
}

export interface ToastStore {
  activeToast: Toast | null
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: () => void
}

let toastId = 0
function nextId(): string {
  toastId += 1
  return `toast-${toastId}-${Date.now()}`
}

export const toastStore = create<ToastStore>()((set) => ({
  activeToast: null,
  showToast: (toast) =>
    set({
      activeToast: {
        ...toast,
        id: nextId(),
        duration: toast.duration ?? 4000,
      },
    }),
  hideToast: () => set({ activeToast: null }),
}))
