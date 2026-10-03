import type { SupabaseClient, User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

let isWeddingAdminAuthenticated = false
const adminAuthListeners = new Set<() => void>()
let supabasePromise: Promise<SupabaseClient> | null = null

function publishAdminAuth(user: User | null) {
  const nextValue = user?.app_metadata?.role === 'wedding_admin'
  if (nextValue === isWeddingAdminAuthenticated) return
  isWeddingAdminAuthenticated = nextValue
  adminAuthListeners.forEach((listener) => listener())
}

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseUrl || !supabasePublishableKey) return Promise.resolve(null)

  supabasePromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        publishAdminAuth(null)
        return
      }
      publishAdminAuth(session?.user ?? null)
    })

    return client
  })

  return supabasePromise
}

export function subscribeToAdminAuth(listener: () => void) {
  adminAuthListeners.add(listener)
  void getSupabase()
  return () => adminAuthListeners.delete(listener)
}

export function getAdminAuthSnapshot() {
  return isWeddingAdminAuthenticated
}

export function setAdminAuthFromUser(user: User | null) {
  publishAdminAuth(user)
}