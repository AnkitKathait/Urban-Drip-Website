import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Service-role client for API routes only — never expose to the browser.
// Has full DB access and bypasses Row Level Security.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
