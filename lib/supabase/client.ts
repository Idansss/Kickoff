import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Browser/client Supabase client. Use for auth and data from the client. */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
    )
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

/** Safe getter for use where Supabase is optional (returns null if env not set). */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
