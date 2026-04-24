'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useCart }  from '@/hooks/useCart'
import { useAuth }  from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, isValidPincode, isValidPhone, pointsFromAmount, discountFromPoints } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ChevronRight, Plus, Check, MapPin, Tag, ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { Address, AddressFormData } from '@/types'

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void }
  }
}

type Step = 'address' | 'review' | 'payment'

const BLANK_ADDRESS: AddressFormData = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', is_default: false,
}

export default function CheckoutPage() {
  const router                                    = useRouter()
  const { items, subtotal, clearCart }            = useCart()
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth()

  const [step,             setStep]             = useState<Step>('address')
  const [addresses,        setAddresses]        = useState<Address[]>([])
  const [selectedAddr,     setSelectedAddr]     = useState<Address | null>(null)
  const [showNewAddrForm,  setShowNewAddrForm]  = useState(false)
  const [newAddr,          setNewAddr]          = useState<AddressFormData>(BLANK_ADDRESS)
  const [savingAddr,       setSavingAddr]       = useState(false)
  const [redeemPoints,     setRedeemPoints]     = useState(false)
  const [processing,       setProcessing]       = useState(false)

  const shipping      = subtotal >= 999 ? 0 : 99
  const maxRedeemable = profile ? Math.min(profile.loyalty_points, 1000) : 0
  const discount      = redeemPoints ? discountFromPoints(maxRedeemable) : 0
  const total         = Math.max(0, subtotal + shipping - discount)
  const earnPoints    = pointsFromAmount(total)

  const fetchAddresses = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    if (data) {
      setAddresses(data as Address[])
      const def = data.find(a => a.is_default) ?? data[0] ?? null
      setSelectedAddr(def as Address | null)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/checkout')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) fetchAddresses()
  }, [user, fetchAddresses])

  useEffect(() => {
    if (!authLoading && items.length === 0) {
      router.replace('/cart')
    }
  }, [authLoading, items.length, router])

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(newAddr.phone))   { toast.error('Invalid phone number'); return }
    if (!isValidPincode(newAddr.pincode)) { toast.error('Invalid pincode'); return }

    setSavingAddr(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...newAddr, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      toast.success('Address saved')
      setSelectedAddr(data as Address)
      setShowNewAddrForm(false)
      setNewAddr(BLANK_ADDRESS)
      fetchAddresses()
    } catch {
      toast.error('Failed to save address')
    } finally {
      setSavingAddr(false)
    }
  }

  function loadRazorpay(): Promise<boolean> {
    return new Promise(resolve => {
      if (typeof window.Razorpay !== 'undefined') { resolve(true); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload  = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handlePay() {
    if (!selectedAddr) { toast.error('Please select a shipping address'); return }
    if (!user)         return
    setProcessing(true)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Payment service unavailable. Please try again.'); return }

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'INR' }),
      })
      if (!res.ok) throw new Error('Failed to create payment order')
      const { order: rzpOrder } = await res.json()

      const opts = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rzpOrder.amount,
        currency:    'INR',
        name:        'Urban Drip',
        description: `${items.length} item${items.length > 1 ? 's' : ''}`,
        order_id:    rzpOrder.id,
        prefill: {
          name:    profile?.full_name ?? '',
          contact: profile?.phone ?? selectedAddr.phone,
          email:   user.email ?? '',
        },
        theme: { color: '#FF3B3B' },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const orderRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address_id:              selectedAddr.id,
                items:                   items.map(i => ({
                  variant_id:    i.variant_id,
                  product_title: i.product_title,
                  size:          i.size,
                  quantity:      i.quantity,
                  price:         i.price,
                  total:         i.price * i.quantity,
                })),
                subtotal,
                shipping_cost:           shipping,
                discount,
                total,
                razorpay_order_id:       response.razorpay_order_id,
                razorpay_payment_id:     response.razorpay_payment_id,
                razorpay_signature:      response.razorpay_signature,
                loyalty_points_redeemed: redeemPoints ? maxRedeemable : 0,
                loyalty_points_earned:   earnPoints,
              }),
            })
            if (!orderRes.ok) throw new Error()
            const { order } = await orderRes.json()
            clearCart()
            router.push(`/account/orders/${order.id}?new=1`)
          } catch {
            toast.error('Order placement failed. Contact support with your payment ID.')
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      }

      const rzp = new window.Razorpay(opts)
      rzp.open()
    } catch {
      toast.error('Payment initialization failed. Please try again.')
      setProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="ud-container py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ud-accent animate-spin" />
      </div>
    )
  }

  const STEPS: Step[] = ['address', 'review', 'payment']
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="ud-container py-12 max-w-5xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {(['address', 'review', 'payment'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors',
              i < stepIndex  ? 'bg-ud-neon text-ud-black' :
              i === stepIndex ? 'bg-ud-accent text-white' :
              'bg-ud-gray text-ud-muted'
            )}>
              {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs font-heading tracking-wider hidden sm:block',
              i === stepIndex ? 'text-ud-white' : 'text-ud-muted'
            )}>
              {s.toUpperCase()}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-ud-gray" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left panel ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: Address */}
          {step === 'address' && (
            <div>
              <h2 className="font-bebas text-3xl text-ud-white mb-6">SHIPPING ADDRESS</h2>

              {addresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  {addresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddr(addr)}
                      className={cn(
                        'w-full text-left p-4 border rounded-sm transition-all duration-150 flex items-start gap-3',
                        selectedAddr?.id === addr.id
                          ? 'border-ud-accent bg-ud-accent/5'
                          : 'border-ud-gray hover:border-ud-muted'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
                        selectedAddr?.id === addr.id ? 'border-ud-accent' : 'border-ud-muted'
                      )}>
                        {selectedAddr?.id === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-ud-accent" />}
                      </div>
                      <div>
                        <p className="font-heading text-sm text-ud-white tracking-wide">{addr.full_name}</p>
                        <p className="text-ud-muted text-sm mt-0.5">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                        <p className="text-ud-muted text-sm">{addr.city}, {addr.state} – {addr.pincode}</p>
                        <p className="font-mono text-xs text-ud-muted mt-1">{addr.phone}</p>
                        {addr.is_default && (
                          <span className="inline-block mt-2 text-[10px] font-mono text-ud-neon border border-ud-neon/30 px-2 py-0.5 rounded-sm">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!showNewAddrForm ? (
                <button
                  onClick={() => setShowNewAddrForm(true)}
                  className="flex items-center gap-2 text-sm text-ud-accent hover:text-ud-white font-heading tracking-wider transition-colors border border-dashed border-ud-accent/40 hover:border-ud-accent px-4 py-3 rounded-sm w-full justify-center"
                >
                  <Plus className="w-4 h-4" /> ADD NEW ADDRESS
                </button>
              ) : (
                <form onSubmit={handleSaveAddress} className="space-y-4 border border-ud-gray rounded-sm p-5">
                  <h3 className="font-heading text-sm text-ud-white tracking-wider mb-4">NEW ADDRESS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name"     value={newAddr.full_name}     onChange={e => setNewAddr(a => ({ ...a, full_name: e.target.value }))}     required />
                    <Input label="Phone"         value={newAddr.phone}         onChange={e => setNewAddr(a => ({ ...a, phone: e.target.value }))}         required type="tel" maxLength={10} />
                    <Input label="Address Line 1" value={newAddr.address_line1} onChange={e => setNewAddr(a => ({ ...a, address_line1: e.target.value }))} required className="sm:col-span-2" />
                    <Input label="Address Line 2 (optional)" value={newAddr.address_line2 ?? ''} onChange={e => setNewAddr(a => ({ ...a, address_line2: e.target.value }))} className="sm:col-span-2" />
                    <Input label="City"          value={newAddr.city}          onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))}          required />
                    <Input label="State"         value={newAddr.state}         onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))}         required />
                    <Input label="Pincode"       value={newAddr.pincode}       onChange={e => setNewAddr(a => ({ ...a, pincode: e.target.value }))}       required maxLength={6} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newAddr.is_default} onChange={e => setNewAddr(a => ({ ...a, is_default: e.target.checked }))} className="accent-ud-accent" />
                    <span className="text-sm text-ud-muted">Set as default address</span>
                  </label>
                  <div className="flex gap-3">
                    <Button type="submit" loading={savingAddr} size="sm">SAVE ADDRESS</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewAddrForm(false)}>CANCEL</Button>
                  </div>
                </form>
              )}

              <Button
                disabled={!selectedAddr}
                onClick={() => setStep('review')}
                className="mt-8 w-full"
                size="lg"
              >
                CONTINUE TO REVIEW <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 'review' && (
            <div>
              <h2 className="font-bebas text-3xl text-ud-white mb-6">REVIEW ORDER</h2>

              {/* Delivery address summary */}
              {selectedAddr && (
                <div className="flex items-start gap-3 p-4 bg-ud-dark border border-ud-gray rounded-sm mb-6">
                  <MapPin className="w-4 h-4 text-ud-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm text-ud-muted">
                    <span className="text-ud-white font-heading tracking-wide">{selectedAddr.full_name}</span>
                    <span className="mx-2">·</span>
                    {selectedAddr.address_line1}, {selectedAddr.city} – {selectedAddr.pincode}
                  </div>
                  <button onClick={() => setStep('address')} className="text-xs text-ud-accent hover:underline font-mono">CHANGE</button>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.variant_id} className="flex gap-3 p-3 bg-ud-dark border border-ud-gray rounded-sm">
                    <div className="relative w-14 h-16 bg-ud-gray rounded-sm overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.product_title} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ud-white font-heading line-clamp-1 tracking-wide">{item.product_title}</p>
                      <p className="font-mono text-xs text-ud-muted">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="font-price text-ud-neon text-sm font-bold flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Loyalty points redemption */}
              {profile && profile.loyalty_points >= 100 && (
                <div className={cn(
                  'p-4 border rounded-sm mb-6 transition-colors',
                  redeemPoints ? 'border-ud-gold bg-ud-gold/5' : 'border-ud-gray'
                )}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={e => setRedeemPoints(e.target.checked)}
                      className="accent-ud-gold mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-ud-gold" />
                        <span className="font-heading text-sm text-ud-white tracking-wide">REDEEM LOYALTY POINTS</span>
                      </div>
                      <p className="text-xs text-ud-muted mt-1">
                        You have <span className="text-ud-gold font-mono font-bold">{profile.loyalty_points} pts</span>
                        {' '}— redeem up to {maxRedeemable} pts for <span className="text-ud-gold">{formatPrice(discount)}</span> off
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <Button onClick={() => setStep('payment')} className="w-full" size="lg">
                CONTINUE TO PAYMENT <ChevronRight className="w-4 h-4" />
              </Button>
              <button onClick={() => setStep('address')} className="mt-3 w-full text-center text-xs text-ud-muted hover:text-ud-white font-mono transition-colors">
                ← BACK TO ADDRESS
              </button>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 'payment' && (
            <div>
              <h2 className="font-bebas text-3xl text-ud-white mb-6">PAYMENT</h2>

              <div className="p-6 border border-ud-gray rounded-sm mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-ud-gray rounded-sm flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-ud-accent" />
                  </div>
                  <div>
                    <p className="font-heading text-sm text-ud-white tracking-wide">RAZORPAY SECURE CHECKOUT</p>
                    <p className="text-xs text-ud-muted">UPI, Cards, Net Banking, Wallets</p>
                  </div>
                </div>
                <p className="text-sm text-ud-muted leading-relaxed">
                  Clicking "Pay Now" will open the Razorpay payment gateway. Your payment is 100% secure and encrypted.
                </p>
              </div>

              <div className="p-4 bg-ud-neon/5 border border-ud-neon/20 rounded-sm mb-6">
                <p className="text-sm text-ud-neon font-mono">
                  🎉 You'll earn <strong>{earnPoints} loyalty points</strong> on this order (worth {formatPrice(discountFromPoints(earnPoints))} on your next purchase)
                </p>
              </div>

              <Button
                onClick={handlePay}
                loading={processing}
                className="w-full"
                size="lg"
              >
                PAY {formatPrice(total)} NOW
              </Button>
              <button onClick={() => setStep('review')} className="mt-3 w-full text-center text-xs text-ud-muted hover:text-ud-white font-mono transition-colors">
                ← BACK TO REVIEW
              </button>
            </div>
          )}
        </div>

        {/* ── Order summary sidebar ──────────────────────────────────────────── */}
        <div>
          <div className="sticky top-20 bg-ud-dark border border-ud-gray rounded-sm p-5 space-y-4">
            <h3 className="font-heading text-sm text-ud-white tracking-wider">ORDER SUMMARY</h3>
            <div className="divider" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ud-muted">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-price text-ud-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ud-muted">Shipping</span>
                <span className={cn('font-price', shipping === 0 ? 'text-ud-neon' : 'text-ud-white')}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ud-gold">Points discount</span>
                  <span className="font-price text-ud-gold">−{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="divider" />
            <div className="flex justify-between items-center">
              <span className="font-heading text-sm text-ud-white tracking-wider">TOTAL</span>
              <span className="font-price text-2xl text-ud-neon font-bold">{formatPrice(total)}</span>
            </div>

            <div className="text-xs text-ud-muted font-mono space-y-1 pt-1">
              <p>🔒 256-bit SSL encrypted</p>
              <p>📦 Ships in 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
