'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

type Params = Promise<{ id: string }>

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:    'confirmed',
  confirmed:  'processing',
  processing: 'shipped',
  shipped:    'delivered',
  delivered:  null,
  cancelled:  null,
  returned:   null,
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'text-[#F97316] bg-[#F97316]/10',
  confirmed:  'text-[#3B82F6] bg-[#3B82F6]/10',
  processing: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
  shipped:    'text-[#06B6D4] bg-[#06B6D4]/10',
  delivered:  'text-ud-neon bg-ud-neon/10',
  cancelled:  'text-ud-accent bg-ud-accent/10',
  returned:   'text-[#888] bg-[#888]/10',
}

export default function OrderDetailPage({ params }: { params: Params }) {
  const { id }  = use(params)
  const router  = useRouter()
  const [order,    setOrder]    = useState<Order | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(r => { if (r.data) setOrder(r.data) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return
    setUpdating(true)
    setError('')
    const r = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const j = await r.json()
    if (!r.ok) setError(j.error ?? 'Update failed')
    else setOrder(prev => prev ? { ...prev, status: newStatus, ...j.data } : prev)
    setUpdating(false)
  }

  if (loading) return (
    <div className="p-8 animate-pulse space-y-4 max-w-4xl">
      <div className="h-8 w-48 bg-[#1A1A1A]" />
      <div className="h-64 bg-[#111] border border-[#1E1E1E]" />
    </div>
  )

  if (!order) return (
    <div className="p-8">
      <p className="text-[#555] text-sm font-sans">Order not found.</p>
    </div>
  )

  const nextStatus = NEXT_STATUS[order.status]
  const addr       = order.address

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/orders')} className="text-[#444] hover:text-ud-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-ud-white">#{order.order_number}</h1>
            <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">
              {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'font-heading text-[11px] tracking-[0.15em] px-3 py-1.5',
            STATUS_COLORS[order.status]
          )}>
            {order.status.toUpperCase()}
          </span>
          {nextStatus && (
            <button
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] font-heading text-[11px] tracking-[0.1em] hover:text-ud-white hover:border-[#444] disabled:opacity-50 transition-all"
            >
              → {nextStatus.toUpperCase()}
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={updating}
              className="px-4 py-2 border border-ud-accent/30 text-ud-accent font-heading text-[11px] tracking-[0.1em] hover:bg-ud-accent/10 disabled:opacity-50 transition-all"
            >
              CANCEL
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-ud-accent/10 border border-ud-accent text-ud-accent text-sm font-sans">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Order items ── */}
        <div className="lg:col-span-2 space-y-4">
          <InfoBlock title="ORDER ITEMS" Icon={Package}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  {['PRODUCT', 'SIZE', 'QTY', 'PRICE', 'TOTAL'].map(h => (
                    <th key={h} className="pb-3 text-left font-heading text-[10px] tracking-[0.12em] text-[#333] pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map(item => (
                  <tr key={item.id} className="border-b border-[#141414]">
                    <td className="py-3 pr-4 text-sm text-[#C0C0C0] font-sans">{item.product_title}</td>
                    <td className="py-3 pr-4">
                      <span className="font-heading text-[10px] text-[#555] border border-[#2A2A2A] px-1.5 py-0.5">{item.size}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#555] font-sans">{item.quantity}</td>
                    <td className="py-3 pr-4 font-price text-sm text-[#888]">{formatPrice(item.price)}</td>
                    <td className="py-3 font-price text-sm text-ud-neon">{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfoBlock>

          {/* Tracking */}
          {(order.tracking_number || order.shiprocket_order_id) && (
            <InfoBlock title="SHIPPING" Icon={Truck}>
              <dl className="space-y-2">
                {order.shiprocket_order_id && <Row label="Shiprocket ID" value={order.shiprocket_order_id} />}
                {order.tracking_number && <Row label="Tracking #" value={order.tracking_number} />}
                {order.tracking_url && (
                  <div className="flex items-center justify-between">
                    <dt className="font-heading text-[10px] tracking-[0.1em] text-[#444]">TRACKING URL</dt>
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-[10px] text-ud-accent hover:underline"
                    >
                      TRACK ORDER →
                    </a>
                  </div>
                )}
              </dl>
            </InfoBlock>
          )}
        </div>

        {/* ── Right col ── */}
        <div className="space-y-4">

          {/* Financials */}
          <InfoBlock title="PAYMENT" Icon={CreditCard}>
            <dl className="space-y-2">
              <Row label="SUBTOTAL"   value={formatPrice(order.subtotal)} />
              <Row label="SHIPPING"   value={formatPrice(order.shipping_cost)} />
              {order.discount > 0 && <Row label="DISCOUNT" value={`-${formatPrice(order.discount)}`} accent="neon" />}
              <div className="border-t border-[#1A1A1A] pt-2 mt-2">
                <Row label="TOTAL" value={formatPrice(order.total)} accent="neon" bold />
              </div>
            </dl>
            {order.razorpay_payment_id && (
              <div className="mt-4 pt-3 border-t border-[#1A1A1A]">
                <p className="font-heading text-[9px] tracking-[0.15em] text-[#333] mb-1">PAYMENT ID</p>
                <p className="font-sans text-[11px] text-[#555] break-all">{order.razorpay_payment_id}</p>
              </div>
            )}
            {order.loyalty_points_earned > 0 && (
              <div className="mt-3 px-3 py-2 bg-ud-neon/5 border border-ud-neon/10">
                <p className="font-heading text-[10px] text-ud-neon tracking-wider">+{order.loyalty_points_earned} LOYALTY POINTS EARNED</p>
              </div>
            )}
          </InfoBlock>

          {/* Address */}
          {addr && (
            <InfoBlock title="SHIPPING ADDRESS" Icon={MapPin}>
              <div className="space-y-0.5 text-sm font-sans text-[#888] leading-relaxed">
                <p className="text-[#C0C0C0] font-medium">{addr.full_name}</p>
                <p>{addr.phone}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} {addr.pincode}</p>
              </div>
            </InfoBlock>
          )}

          {/* Notes */}
          {order.notes && (
            <InfoBlock title="NOTES" Icon={Package}>
              <p className="text-sm font-sans text-[#888]">{order.notes}</p>
            </InfoBlock>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ title, Icon, children }: { title: string; Icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1A1A1A]">
        <Icon className="w-3.5 h-3.5 text-[#444]" />
        <h3 className="font-heading text-[10px] tracking-[0.2em] text-[#444]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: 'neon'; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-heading text-[10px] tracking-[0.1em] text-[#444]">{label}</dt>
      <dd className={cn(
        'font-price text-sm',
        accent === 'neon' ? 'text-ud-neon' : 'text-[#888]',
        bold && 'font-bold'
      )}>
        {value}
      </dd>
    </div>
  )
}
