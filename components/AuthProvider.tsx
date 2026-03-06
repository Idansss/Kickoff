'use client'

import { useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { userStore } from '@/store/userStore'

/**
 * Listens to Supabase auth state changes and syncs the authenticated user
 * into the Zustand userStore. Works gracefully when Supabase is not configured.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    // Sync on mount
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        syncSupabaseUser(data.user)
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncSupabaseUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}

function syncSupabaseUser(user: { id: string; email?: string; user_metadata?: Record<string, string> }) {
  const meta = user.user_metadata ?? {}
  const name: string = meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'User'
  const handle = (meta.preferred_username ?? name.toLowerCase().replace(/\s+/g, ''))

  userStore.getState().updateCurrentUser({
    name,
    handle,
    bio: meta.bio ?? undefined,
    avatarImage: meta.avatar_url ?? undefined,
  })
}
