import { redirect }    from 'next/navigation'
import Link            from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, ORDER_STATUS_META } from '@/lib/utils'
import { ChevronRight, Package } from 'lucide-react'
import type { Order } from '@/types'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/orders')

  const { data } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at, subtotal, shipping_cost, discount')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[]

  return (
    <div className="ud-container py-12 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/account" className="text-xs text-ud-muted hover:text-ud-accent font-mono transition-colors">ACCOUNT</Link>
        <span className="text-ud-gray">/</span>
        <span className="text-xs text-ud-white font-mono">ORDERS</span>
      </div>
      <h1 className="font-bebas text-5xl text-ud-white mb-10">MY ORDERS</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-ud-gray rounded-full">
            <Package className="w-10 h-10 text-ud-muted" />
          </div>
          <p className="font-heading text-xl text-ud-white mb-3">NO ORDERS YET</p>
          <p className="text-ud-muted mb-8">Your orders will appear here after you shop.</p>
          <Link href="/products" className="btn-primary inline-flex">SHOP NOW</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const meta = ORDER_STATUS_META[order.status]
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-5 bg-ud-dark border border-ud-gray rounded-sm hover:border-ud-muted transition-colors group"
              >
                <div>
                  <p className="font-mono text-sm text-ud-white font-bold">{order.order_number}</p>
                  <p className="text-xs text-ud-muted mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`hidden sm:block text-xs font-mono px-2.5 py-1 rounded-sm ${meta.bgColor} ${meta.color}`}>
                    {meta.label.toUpperCase()}
                  </span>
                  <span className="font-price text-ud-white font-bold">{formatPrice(order.total)}</span>
                  <ChevronRight className="w-4 h-4 text-ud-muted group-hover:text-ud-white transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
