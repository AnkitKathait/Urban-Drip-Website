import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

// ─── Standard JSON responses ──────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status })
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, profile: null, supabase, response: err('Unauthorized', 401) }
  }

  return { user, profile: null, supabase, response: null }
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, profile: null, supabase, response: err('Unauthorized', 401) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { user, profile: null, supabase, response: err('Forbidden', 403) }
  }

  return { user, profile: profile as Profile, supabase, response: null }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function parsePagination(searchParams: URLSearchParams) {
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '24', 10))
  const from  = (page - 1) * limit
  const to    = from + limit - 1
  return { page, limit, from, to }
}
