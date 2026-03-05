'use client'

import { useEffect } from 'react'
import { userStore } from '@/store/userStore'

export function StoreInitializer() {
  useEffect(() => {
    userStore.getState().initUser()
    userStore.getState().incrementStreak()
  }, [])
  return null
}
