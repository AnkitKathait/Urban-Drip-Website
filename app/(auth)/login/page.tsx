'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input }  from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [mode,     setMode]     = useState<'email' | 'otp'>('email')
  const [otpSent,  setOtpSent]  = useState(false)
  const [otp,      setOtp]      = useState('')

  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirect    = searchParams.get('redirect') ?? '/'

  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error(error.message); return }
      toast.success('Welcome back!')
      router.push(redirect)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
      },
    })
    if (error) { toast.error(error.message); setLoading(false) }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(email.replace(/\s/g, ''))) {
      toast.error('Enter a valid 10-digit Indian mobile number')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: `+91${email}` })
      if (error) { toast.error(error.message); return }
      setOtpSent(true)
      toast.success('OTP sent!')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${email}`,
        token: otp,
        type:  'sms',
      })
      if (error) { toast.error(error.message); return }
      toast.success('Welcome!')
      router.push(redirect)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl text-ud-white mb-2">WELCOME BACK</h1>
          <p className="text-ud-muted text-sm">Sign in to your Urban Drip account.</p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-ud-gray rounded-sm text-sm font-sans text-ud-white hover:border-ud-muted transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

        {/* Mode toggle */}
        <div className="flex border border-ud-gray rounded-sm mb-6 overflow-hidden">
          {(['email', 'otp'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-heading tracking-wider transition-colors ${mode === m ? 'bg-ud-accent text-white' : 'text-ud-muted hover:text-ud-white'}`}
            >
              {m === 'email' ? 'EMAIL + PASSWORD' : 'PHONE OTP'}
            </button>
          ))}
        </div>

        {/* Email form */}
        {mode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-ud-muted hover:text-ud-accent transition-colors">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              SIGN IN
            </Button>
          </form>
        )}

        {/* OTP form */}
        {mode === 'otp' && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-4">
            <Input
              label="Mobile number (10 digits)"
              type="tel"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="9XXXXXXXXX"
              maxLength={10}
              disabled={otpSent}
              required
            />
            {otpSent && (
              <Input
                label="Enter OTP"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="XXXXXX"
                maxLength={6}
                required
              />
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </Button>
            {otpSent && (
              <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs text-ud-muted hover:text-ud-white transition-colors">
                Resend OTP
              </button>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ud-muted">
          Don&apos;t have an account?{' '}
          <Link href={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`} className="text-ud-accent hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
