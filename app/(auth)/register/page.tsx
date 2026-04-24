'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input }  from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirect    = searchParams.get('redirect') ?? '/'

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data:        { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
        },
      })
      if (error) { toast.error(error.message); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleRegister() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
      },
    })
    if (error) { toast.error(error.message); setLoading(false) }
  }

  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-ud-neon/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-ud-neon text-3xl">✓</span>
          </div>
          <h2 className="font-bebas text-3xl text-ud-white mb-3">CHECK YOUR EMAIL</h2>
          <p className="text-ud-muted text-sm leading-relaxed mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-ud-white">{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="btn-secondary inline-block">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl text-ud-white mb-2">JOIN THE DRIP</h1>
          <p className="text-ud-muted text-sm">Create your Urban Drip account. Get 50 loyalty points on your first order.</p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-ud-gray rounded-sm text-sm font-sans text-ud-white hover:border-ud-muted transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-ud-gray" />
          <span className="text-ud-muted text-xs font-mono">OR</span>
          <div className="flex-1 h-px bg-ud-gray" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Naruto Uzumaki"
            required
            autoComplete="name"
          />
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            hint="Use a strong password you don't use elsewhere."
          />

          <p className="text-[11px] text-ud-muted leading-relaxed">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-ud-accent hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-ud-accent hover:underline">Privacy Policy</Link>.
          </p>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            CREATE ACCOUNT
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ud-muted">
          Already have an account?{' '}
          <Link href={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`} className="text-ud-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
