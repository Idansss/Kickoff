import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKickoffTime(isoString: string): string {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

export function formatMatchDate(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function scrollToAndHighlight(elementId: string, color = '#16a34a') {
  if (typeof document === 'undefined') return
  const el = document.getElementById(elementId)
  if (!el) return

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const previousTransition = el.style.transition
  const previousBorder = el.style.border
  const previousBorderRadius = el.style.borderRadius

  el.style.transition = 'border-color 0.3s ease'
  el.style.border = `2px solid ${color}`
  if (!previousBorderRadius) {
    el.style.borderRadius = '12px'
  }

  window.setTimeout(() => {
    el.style.border = previousBorder || '2px solid transparent'
    el.style.transition = previousTransition
    el.style.borderRadius = previousBorderRadius
  }, 2000)
}

