'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, ShoppingBag, Users, AlertTriangle, DollarSign, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardData {
  stats: {
    total_revenue: number
    revenue_today: number
    total_orders: number
    orders_today: number
    pending_orders: number
    total_customers: number
    low_stock_count: number
    avg_order_value: number
  }
  recent_orders: Array<{
    id: string
    order_number: string
    status: string
    total: number
    created_at: string
    user_id: string
  }>
  low_stock: Array<{
    id: string
    size: string
    stock: number
    product_id: string
    products: { title: string; images: string[] } | null
  }>
  revenue_chart: Array<{ date: string; revenue: number; orders: number }>
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(r => { if (r.data) setData(r.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell><Skeleton /></PageShell>
  if (!data)   return <PageShell><p className="text-[#555]">Failed to load dashboard.</p></PageShell>

  const { stats, recent_orders, low_stock, revenue_chart } = data
  const maxRevenue = Math.max(...revenue_chart.map(d => d.revenue), 1)

  return (
    <PageShell>
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ud-white">DASHBOARD</h1>
        <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">OVERVIEW & METRICS</p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="TOTAL REVENUE"
          value={formatPrice(stats.total_revenue)}
          sub={`+${formatPrice(stats.revenue_today)} today`}
          Icon={DollarSign}
          accent="neon"
        />
        <StatCard
          label="TOTAL ORDERS"
          value={stats.total_orders.toLocaleString()}
          sub={`${stats.orders_today} today`}
          Icon={ShoppingBag}
        />
        <StatCard
          label="CUSTOMERS"
          value={stats.total_customers.toLocaleString()}
          sub={`avg ${formatPrice(stats.avg_order_value)}/order`}
          Icon={Users}
        />
        <StatCard
          label="PENDING"
          value={stats.pending_orders.toString()}
          sub={`${stats.low_stock_count} low stock alerts`}
          Icon={Clock}
          accent={stats.pending_orders > 0 ? 'accent' : undefined}
        />
      </div>

      {/* ── Revenue chart + low stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-[#111] border border-[#1E1E1E] p-6">
          <h3 className="font-heading text-[11px] tracking-[0.2em] text-[#555] mb-6">REVENUE — LAST 14 DAYS</h3>
          <div className="flex items-end gap-1.5 h-32">
            {revenue_chart.map(d => {
              const pct = (d.revenue / maxRevenue) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-ud-accent/20 group-hover:bg-ud-accent/40 transition-colors rounded-none"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  <span className="font-heading text-[8px] text-[#333] group-hover:text-[#555] transition-colors">
                    {d.date.slice(5)}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                    <div className="bg-[#1E1E1E] border border-[#333] px-2 py-1.5 text-[10px] font-heading whitespace-nowrap">
                      <div className="text-ud-white">{formatPrice(d.revenue)}</div>
                      <div className="text-[#555]">{d.orders} orders</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-[#111] border border-[#1E1E1E] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-[11px] tracking-[0.2em] text-[#555]">LOW STOCK</h3>
            <AlertTriangle className="w-4 h-4 text-[#F97316]" />
          </div>
          {low_stock.length === 0 ? (
            <p className="text-[#444] text-sm font-sans">All variants well-stocked.</p>
          ) : (
            <ul className="space-y-3">
              {low_stock.map(v => (
                <li key={v.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[#888] text-xs font-sans truncate">
                      {v.products?.title ?? 'Unknown'}
                    </p>
                    <p className="font-heading text-[10px] text-[#555] tracking-wider">SIZE {v.size}</p>
                  </div>
                  <span className={cn(
                    'font-heading text-[11px] tracking-wider px-2 py-0.5 flex-shrink-0',
                    v.stock === 0 ? 'bg-ud-accent/10 text-ud-accent' : 'bg-[#F97316]/10 text-[#F97316]'
                  )}>
                    {v.stock === 0 ? 'OOS' : `${v.stock} LEFT`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {low_stock.length > 0 && (
            <Link
              href="/admin/inventory"
              className="mt-4 block text-center font-heading text-[10px] tracking-[0.15em] text-[#444] hover:text-ud-white border border-[#1E1E1E] hover:border-[#333] py-2 transition-colors"
            >
              MANAGE INVENTORY
            </Link>
          )}
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="bg-[#111] border border-[#1E1E1E]">
        <div className="px-6 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <h3 className="font-heading text-[11px] tracking-[0.2em] text-[#555]">RECENT ORDERS</h3>
          <Link
            href="/admin/orders"
            className="font-heading text-[10px] tracking-[0.15em] text-[#444] hover:text-ud-white transition-colors"
          >
            VIEW ALL →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                {['ORDER', 'STATUS', 'TOTAL', 'DATE'].map(h => (
                  <th key={h} className="px-6 py-3 text-left font-heading text-[10px] tracking-[0.15em] text-[#333]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_orders.map(order => (
                <tr
                  key={order.id}
                  className="border-b border-[#141414] hover:bg-[#141414] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-heading text-[11px] tracking-wider text-ud-white hover:text-ud-accent transition-colors"
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={cn(
                      'font-heading text-[10px] tracking-[0.12em] px-2.5 py-1',
                      STATUS_COLORS[order.status] ?? 'text-[#888] bg-[#888]/10'
                    )}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-price text-sm text-ud-neon">{formatPrice(order.total)}</td>
                  <td className="px-6 py-3.5 text-xs text-[#444] font-sans">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent_orders.length === 0 && (
            <p className="px-6 py-8 text-[#444] text-sm font-sans text-center">No orders yet.</p>
          )}
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="p-8 max-w-7xl">{children}</div>
}

function StatCard({
  label, value, sub, Icon, accent,
}: {
  label: string
  value: string
  sub?: string
  Icon: React.ElementType
  accent?: 'neon' | 'accent'
}) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="font-heading text-[10px] tracking-[0.2em] text-[#444]">{label}</p>
        <Icon className={cn('w-4 h-4', accent === 'neon' ? 'text-ud-neon' : accent === 'accent' ? 'text-ud-accent' : 'text-[#333]')} />
      </div>
      <p className={cn(
        'font-display text-2xl',
        accent === 'neon' ? 'text-ud-neon' : accent === 'accent' ? 'text-ud-accent' : 'text-ud-white'
      )}>
        {value}
      </p>
      {sub && <p className="font-heading text-[10px] tracking-wider text-[#444] mt-1.5">{sub}</p>}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[#1A1A1A]" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#111] border border-[#1E1E1E]" />)}
      </div>
      <div className="h-48 bg-[#111] border border-[#1E1E1E]" />
    </div>
  )
}
