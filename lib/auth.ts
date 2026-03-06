import { db } from './db'
import { createClient } from './supabase/server'

export async function getAuthedUserId(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Find or create a Prisma user linked to the Supabase auth user
      let prismaUser = await db.user.findFirst({
        where: { handle: user.email?.split('@')[0] ?? user.id },
      })

      if (!prismaUser) {
        prismaUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } })
      }

      if (prismaUser) return prismaUser.id
    }
  } catch {
    // Fall through to demo user
  }

  // Fallback: return first seeded user for demo mode
  const user = await db.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!user) throw new Error('No demo user found. Seed the database first.')
  return user.id
}

// Backwards-compatible alias used by older route handlers.
export async function getCurrentUserId(): Promise<string> {
  return getAuthedUserId()
}
