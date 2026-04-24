import { redirect, notFound } from 'next/navigation'
import Link                   from 'next/link'
import { createClient }       from '@/lib/supabase/server'
import { formatDate, formatPrice, ORDER_STATUS_META } from '@/lib/utils'
import { Package, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react'
import type { Order, OrderItem } from '@/types'

type Params = Promise<{ id: string }>

type OrderDetail = Order & {
  address: {
    full_name: string; phone: string; address_line1: string;
    address_line2?: string; city: string; state: string; pincode: string
  } | null
  order_items: (OrderItem & { product_variants?: { products?: { slug?: string } } })[]
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const sp     = await searchParams
  const isNew  = sp.new === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/orders')

  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      address:addresses(*),
      order_items(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()
  const order = data as OrderDetail
  const meta  = ORDER_STATUS_META[order.status]

  const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
  const currentStep  = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="ud-container py-12 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/account" className="text-xs text-ud-muted hover:text-ud-accent font-mono transition-colors">ACCOUNT</Link>
        <span className="text-ud-gray">/</span>
        <Link href="/account/orders" className="text-xs text-ud-muted hover:text-ud-accent font-mono transition-colors">ORDERS</Link>
        <span className="text-ud-gray">/</span>
        <span className="text-xs text-ud-white font-mono">{order.order_number}</span>
      </div>

      {/* New order success banner */}
      {isNew && (
        <div className="flex items-center gap-3 p-4 bg-ud-neon/10 border border-ud-neon/30 rounded-sm mb-8">
          <CheckCircle2 className="w-5 h-5 text-ud-neon flex-shrink-0" />
          <div>
            <p className="font-heading text-sm text-ud-neon tracking-wide">ORDER PLACED SUCCESSFULLY!</p>
            <p className="text-xs text-ud-muted mt-0.5">You'll receive a confirmation once it's processed.</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-bebas text-4xl text-ud-white">{order.order_number}</h1>
          <p className="text-ud-muted text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-sm text-sm font-mono ${meta.bgColor} ${meta.color}`}>
          {meta.label.toUpperCase()}
        </span>
      </div>

      {/* Status tracker */}
      {!['cancelled', 'returned'].includes(order.status) && (
        <div className="mb-10 p-5 bg-ud-dark border border-ud-gray rounded-sm">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-ud-gray mx-8" />
            <div
              className="absolute top-3 left-0 h-0.5 bg-ud-accent mx-8 transition-all"
              style={{ width: currentStep >= 0 ? `${Math.min(currentStep / (STATUS_STEPS.length - 1), 1) * 100}%` : '0%' }}
            />
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  i <= currentStep ? 'bg-ud-accent border-ud-accent' : 'bg-ud-black border-ud-gray'
                }`}>
                  {i < currentStep && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  {i === currentStep && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-[10px] font-mono text-ud-muted hidden sm:block capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Delivery address */}
        {order.address && (
          <div className="p-5 bg-ud-dark border border-ud-gray rounded-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-ud-accent" />
              <h3 className="font-heading text-sm text-ud-white tracking-wider">DELIVERY ADDRESS</h3>
            </div>
            <p className="font-heading text-sm text-ud-white">{order.address.full_name}</p>
            <p className="text-ud-muted text-sm mt-1">{order.address.address_line1}</p>
            {order.address.address_line2 && <p className="text-ud-muted text-sm">{order.address.address_line2}</p>}
            <p className="text-ud-muted text-sm">{order.address.city}, {order.address.state} – {order.address.pincode}</p>
            <p className="font-mono text-xs text-ud-muted mt-2">{order.address.phone}</p>
          </div>
        )}

        {/* Tracking */}
        <div className="p-5 bg-ud-dark border border-ud-gray rounded-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-ud-accent" />
            <h3 className="font-heading text-sm text-ud-white tracking-wider">TRACKING</h3>
          </div>
          {order.tracking_number ? (
            <div>
              <p className="font-mono text-sm text-ud-white">{order.tracking_number}</p>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-ud-accent hover:underline font-mono"
                >
                  TRACK SHIPMENT <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-ud-muted text-sm">
              {order.status === 'pending' || order.status === 'confirmed'
                ? 'Your order is being processed. Tracking will be available once shipped.'
                : 'Tracking information not available yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mb-8">
        <h3 className="font-heading text-sm text-ud-white tracking-wider mb-4">ITEMS ORDERED</h3>
        <div className="space-y-3">
          {order.order_items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-ud-dark border border-ud-gray rounded-sm">
              <div>
                <p className="font-heading text-sm text-ud-white tracking-wide">{item.product_title}</p>
                <p className="font-mono text-xs text-ud-muted mt-0.5">
                  Size: {item.size} · Qty: {item.quantity}
                </p>
              </div>
              <p className="font-price text-ud-white">{formatPrice(item.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="p-5 bg-ud-dark border border-ud-gray rounded-sm max-w-sm ml-auto">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ud-muted">Subtotal</span>
            <span className="font-price text-ud-white">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ud-muted">Shipping</span>
            <span className="font-price text-ud-white">
              {order.shipping_cost === 0 ? 'FREE' : formatPrice(order.shipping_cost)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-ud-gold">Points discount</span>
              <span className="font-price text-ud-gold">−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="divider" />
          <div className="flex justify-between items-center">
            <span className="font-heading text-sm text-ud-white tracking-wider">TOTAL</span>
            <span className="font-price text-xl text-ud-neon font-bold">{formatPrice(order.total)}</span>
          </div>
          {order.loyalty_points_earned > 0 && (
            <p className="text-xs text-ud-gold font-mono pt-1">
              +{order.loyalty_points_earned} points earned
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
