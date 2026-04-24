import { redirect }    from 'next/navigation'
import Link            from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, discountFromPoints } from '@/lib/utils'
import { Gift, TrendingUp, Minus, Clock } from 'lucide-react'
import type { LoyaltyTransaction, Profile } from '@/types'

const TYPE_META: Record<LoyaltyTransaction['type'], { label: string; color: string; sign: string }> = {
  earned:     { label: 'Earned',     color: 'text-ud-neon',   sign: '+' },
  redeemed:   { label: 'Redeemed',   color: 'text-ud-accent', sign: '−' },
  expired:    { label: 'Expired',    color: 'text-ud-muted',  sign: '−' },
  adjustment: { label: 'Adjustment', color: 'text-ud-gold',   sign: '±' },
}

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/loyalty')

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('loyalty_points').eq('id', user.id).single(),
    supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const p        = profile as Pick<Profile, 'loyalty_points'> | null
  const points   = p?.loyalty_points ?? 0
  const worth    = discountFromPoints(points)
  const txns     = (transactions ?? []) as LoyaltyTransaction[]

  return (
    <div className="ud-container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/account" className="text-xs text-ud-muted hover:text-ud-accent font-mono transition-colors">ACCOUNT</Link>
        <span className="text-ud-gray">/</span>
        <span className="text-xs text-ud-white font-mono">LOYALTY REWARDS</span>
      </div>
      <h1 className="font-bebas text-5xl text-ud-white mb-10">MY REWARDS</h1>

      {/* Points summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="sm:col-span-2 p-6 bg-gradient-to-br from-ud-gold/20 via-ud-dark to-ud-dark border border-ud-gold/40 rounded-sm">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-ud-gold" />
            <p className="font-mono text-xs text-ud-gold tracking-widest">URBAN DRIP REWARDS</p>
          </div>
          <p className="font-bebas text-7xl text-ud-gold leading-none">{points}</p>
          <p className="font-mono text-sm text-ud-gold/70 mt-1">POINTS BALANCE</p>
          <p className="text-ud-muted text-sm mt-4">
            Worth <span className="text-ud-gold font-bold">{formatPrice(worth)}</span> in discounts
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 p-4 bg-ud-dark border border-ud-gray rounded-sm">
            <TrendingUp className="w-4 h-4 text-ud-neon mb-2" />
            <p className="font-mono text-xs text-ud-muted">EARN RATE</p>
            <p className="font-bebas text-2xl text-ud-white mt-1">1 pt / ₹10</p>
          </div>
          <div className="flex-1 p-4 bg-ud-dark border border-ud-gray rounded-sm">
            <Minus className="w-4 h-4 text-ud-accent mb-2" />
            <p className="font-mono text-xs text-ud-muted">REDEEM RATE</p>
            <p className="font-bebas text-2xl text-ud-white mt-1">100 pts = ₹50</p>
          </div>
        </div>
      </div>

      {/* How to earn */}
      <div className="p-5 bg-ud-dark border border-ud-gray rounded-sm mb-10">
        <h2 className="font-heading text-sm text-ud-white tracking-wider mb-4">HOW TO EARN MORE POINTS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🛍️', label: 'Every Order',    desc: '1 point per ₹10 spent' },
            { icon: '⭐', label: 'Write a Review',  desc: '25 bonus points'       },
            { icon: '🎉', label: 'First Order',     desc: '50 bonus points'       },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="p-3 bg-ud-gray/30 rounded-sm text-center">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="font-heading text-xs text-ud-white tracking-wide">{label}</p>
              <p className="text-xs text-ud-muted mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="font-heading text-sm text-ud-white tracking-wider mb-4">POINTS HISTORY</h2>

        {txns.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-ud-gray rounded-sm">
            <Clock className="w-10 h-10 text-ud-muted mx-auto mb-3" />
            <p className="text-ud-muted text-sm">No transactions yet. Start shopping to earn points!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txns.map(txn => {
              const meta = TYPE_META[txn.type]
              return (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-ud-dark border border-ud-gray rounded-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-sm bg-ud-gray ${meta.color}`}>
                        {meta.label.toUpperCase()}
                      </span>
                    </div>
                    {txn.description && <p className="text-xs text-ud-muted mt-1.5">{txn.description}</p>}
                    <p className="text-xs text-ud-gray font-mono mt-1">{formatDate(txn.created_at)}</p>
                  </div>
                  <p className={`font-mono font-bold text-lg ${meta.color}`}>
                    {meta.sign}{Math.abs(txn.points)} pts
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
