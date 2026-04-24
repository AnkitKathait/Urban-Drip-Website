'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChevronDown } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const STATUSES: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']

const STATUS_COLORS: Record<string, string> = {
  pending:    'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  confirmed:  'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20',
  processing: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20',
  shipped:    'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/20',
  delivered:  'text-ud-neon bg-ud-neon/10 border-ud-neon/20',
  cancelled:  'text-ud-accent bg-ud-accent/10 border-ud-accent/20',
  returned:   'text-[#888] bg-[#888]/10 border-[#888]/20',
}

export default function OrdersPage() {
  const [orders,   setOrders]   = useState<Order[]>([])
  const [total,    setTotal]    = useState(0)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<OrderStatus | 'all'>('all')
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '20' })
    if (status !== 'all') params.set('status', status)
    const r = await fetch(`/api/orders?${params}`)
    const j = await r.json()
    if (j.data) {
      setOrders(j.data.data ?? [])
      setTotal(j.data.total ?? 0)
    }
    setLoading(false)
  }, [page, status])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const displayed = search
    ? orders.filter(o => o.order_number.includes(search.toUpperCase()) || o.id.includes(search))
    : orders

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setOrders(os => os.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setUpdating(null)
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ud-white">ORDERS</h1>
        <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">{total} TOTAL</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={cn(
                'px-3 py-1.5 font-heading text-[10px] tracking-[0.12em] border transition-all',
                status === s
                  ? 'border-ud-white text-ud-white bg-ud-white/5'
                  : 'border-[#1E1E1E] text-[#444] hover:border-[#333] hover:text-[#888]'
              )}
            >
              {s === 'all' ? 'ALL' : s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
          <input
            type="text"
            placeholder="Order # or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#111] border border-[#1E1E1E] pl-9 pr-4 py-2 text-sm font-sans text-ud-white placeholder:text-[#333] focus:outline-none focus:border-[#333] w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#1E1E1E]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                {['ORDER #', 'DATE', 'STATUS', 'ITEMS', 'TOTAL', 'ACTIONS'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-heading text-[10px] tracking-[0.15em] text-[#333]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-[#141414] animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-3 bg-[#1A1A1A]" style={{ width: '70%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : displayed.map(order => (
                <tr key={order.id} className="border-b border-[#141414] hover:bg-[#141414] transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-heading text-[11px] tracking-wider text-ud-white hover:text-ud-accent transition-colors"
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#555] font-sans">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      'font-heading text-[10px] tracking-[0.1em] px-2.5 py-1 border',
                      STATUS_COLORS[order.status] ?? 'text-[#888] bg-[#888]/10 border-[#888]/20'
                    )}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#555] font-sans">{(order.items ?? []).length}</td>
                  <td className="px-5 py-4 font-price text-sm text-ud-neon">{formatPrice(order.total)}</td>
                  <td className="px-5 py-4">
                    <div className="relative group inline-block">
                      <button
                        className="flex items-center gap-1.5 font-heading text-[10px] tracking-[0.1em] text-[#444] hover:text-ud-white transition-colors disabled:opacity-50"
                        disabled={updating === order.id}
                      >
                        STATUS <ChevronDown className="w-3 h-3" />
                      </button>
                      <div className="absolute left-0 top-full mt-1 bg-[#161616] border border-[#2A2A2A] z-10 hidden group-hover:block w-36">
                        {(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[])
                          .filter(s => s !== order.status)
                          .map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(order.id, s)}
                              className="w-full text-left px-3 py-2 font-heading text-[10px] tracking-wider text-[#555] hover:text-ud-white hover:bg-[#1E1E1E] transition-colors"
                            >
                              → {s.toUpperCase()}
                            </button>
                          ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && displayed.length === 0 && (
            <p className="px-5 py-10 text-[#444] text-sm font-sans text-center">No orders found.</p>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-5 py-4 border-t border-[#1A1A1A] flex items-center justify-between">
            <p className="font-heading text-[10px] tracking-[0.1em] text-[#444]">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} OF {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 font-heading text-[10px] tracking-wider text-[#444] border border-[#1E1E1E] hover:border-[#333] hover:text-ud-white disabled:opacity-30 transition-colors">
                PREV
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1.5 font-heading text-[10px] tracking-wider text-[#444] border border-[#1E1E1E] hover:border-[#333] hover:text-ud-white disabled:opacity-30 transition-colors">
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
