import { redirect }    from 'next/navigation'
import Link            from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, ORDER_STATUS_META } from '@/lib/utils'
import { Package, MapPin, Star, ChevronRight, Gift } from 'lucide-react'
import type { Order, Profile } from '@/types'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account')

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const p = profile as Profile | null
  const recentOrders = (orders ?? []) as Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[]

  return (
    <div className="ud-container py-12 max-w-4xl">
      <div className="mb-10">
        <p className="font-mono text-xs text-ud-accent tracking-[0.3em] mb-2">MY ACCOUNT</p>
        <h1 className="font-bebas text-5xl text-ud-white">
          {p?.full_name ? `HEY, ${p.full_name.split(' ')[0].toUpperCase()}` : 'ACCOUNT'}
        </h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="p-5 bg-ud-dark border border-ud-gray rounded-sm">
          <p className="font-mono text-xs text-ud-muted mb-2">TOTAL ORDERS</p>
          <p className="font-bebas text-4xl text-ud-white">{recentOrders.length}</p>
        </div>
        <div className="p-5 bg-ud-dark border border-ud-gold/30 rounded-sm">
          <p className="font-mono text-xs text-ud-gold mb-2">LOYALTY POINTS</p>
          <p className="font-bebas text-4xl text-ud-gold">{p?.loyalty_points ?? 0}</p>
        </div>
        <div className="p-5 bg-ud-dark border border-ud-neon/20 rounded-sm col-span-2 sm:col-span-1">
          <p className="font-mono text-xs text-ud-neon mb-2">POINT VALUE</p>
          <p className="font-bebas text-4xl text-ud-neon">
            {formatPrice(Math.floor((p?.loyalty_points ?? 0) / 100) * 50)}
          </p>
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { href: '/account/orders',    icon: Package,  label: 'My Orders'    },
          { href: '/account/addresses', icon: MapPin,   label: 'Addresses'    },
          { href: '/account/loyalty',   icon: Gift,     label: 'Rewards'      },
          { href: '/products',          icon: Star,     label: 'Shop More'    },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-3 p-5 bg-ud-dark border border-ud-gray rounded-sm hover:border-ud-accent hover:bg-ud-accent/5 transition-all group"
          >
            <Icon className="w-6 h-6 text-ud-muted group-hover:text-ud-accent transition-colors" />
            <span className="font-heading text-xs text-ud-muted group-hover:text-ud-white tracking-wider transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm text-ud-white tracking-widest">RECENT ORDERS</h2>
            <Link href="/account/orders" className="text-xs text-ud-accent font-mono hover:underline">VIEW ALL</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map(order => {
              const meta = ORDER_STATUS_META[order.status]
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between p-4 bg-ud-dark border border-ud-gray rounded-sm hover:border-ud-muted transition-colors group"
                >
                  <div>
                    <p className="font-mono text-sm text-ud-white">{order.order_number}</p>
                    <p className="text-xs text-ud-muted mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded-sm ${meta.bgColor} ${meta.color}`}>
                      {meta.label.toUpperCase()}
                    </span>
                    <span className="font-price text-ud-white">{formatPrice(order.total)}</span>
                    <ChevronRight className="w-4 h-4 text-ud-muted group-hover:text-ud-white transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
