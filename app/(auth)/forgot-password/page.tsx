'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input }  from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email,  setEmail]  = useState('')
  const [sent,   setSent]   = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-ud-neon/10 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-ud-neon" />
          </div>
          <h1 className="font-bebas text-3xl text-ud-white mb-3">CHECK YOUR EMAIL</h1>
          <p className="text-ud-muted text-sm mb-6">
            We've sent a password reset link to <span className="text-ud-white">{email}</span>.
            Check your inbox (and spam folder).
          </p>
          <Link href="/login" className="btn-primary inline-flex w-full justify-center">BACK TO LOGIN</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl text-ud-white mb-2">FORGOT PASSWORD?</h1>
          <p className="text-ud-muted text-sm">Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            SEND RESET LINK
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ud-muted">
          Remember your password?{' '}
          <Link href="/login" className="text-ud-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
