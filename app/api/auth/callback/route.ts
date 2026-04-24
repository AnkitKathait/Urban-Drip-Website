import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get('code')
  const next     = searchParams.get('next') ?? '/'
  const error    = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  if (error) {
    console.error('Supabase auth callback error:', error, errorDesc)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc ?? error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Ensure profile row exists (first OAuth login)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert(
          {
            id:         user.id,
            full_name:  user.user_metadata?.full_name ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Code exchange failed:', exchangeError.message)
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication+failed`)
}
