'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Users } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Customer {
  id: string
  full_name: string | null
  phone: string | null
  loyalty_points: number
  created_at: string
  order_count: number
  total_spent: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total,     setTotal]     = useState(0)
  const [search,    setSearch]    = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '25' })
    if (debouncedSearch) params.set('search', debouncedSearch)
    const r = await fetch(`/api/admin/customers?${params}`)
    const j = await r.json()
    if (j.data) {
      setCustomers(j.data.data ?? [])
      setTotal(j.data.total ?? 0)
    }
    setLoading(false)
  }, [page, debouncedSearch])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ud-white">CUSTOMERS</h1>
          <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">{total.toLocaleString()} TOTAL</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-[#111] border border-[#1E1E1E] pl-10 pr-4 py-2.5 text-sm font-sans text-ud-white placeholder:text-[#333] focus:outline-none focus:border-[#333]"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#1E1E1E]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                {['CUSTOMER', 'PHONE', 'ORDERS', 'TOTAL SPENT', 'LOYALTY PTS', 'JOINED'].map(h => (
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
              ) : customers.map(c => (
                <tr key={c.id} className="border-b border-[#141414] hover:bg-[#141414] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-none bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-[10px] text-[#555]">
                          {(c.full_name ?? 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-[#C0C0C0] font-sans">{c.full_name ?? 'Unknown'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#555] font-sans">{c.phone ?? '—'}</td>
                  <td className="px-5 py-4">
                    <span className="font-heading text-sm text-[#888]">{c.order_count}</span>
                  </td>
                  <td className="px-5 py-4 font-price text-sm text-ud-neon">{formatPrice(c.total_spent)}</td>
                  <td className="px-5 py-4">
                    <span className={`font-heading text-xs tracking-wider ${c.loyalty_points > 0 ? 'text-[#C9A227]' : 'text-[#333]'}`}>
                      {c.loyalty_points.toLocaleString()} PTS
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#444] font-sans">
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && customers.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Users className="w-8 h-8 text-[#2A2A2A]" />
              <p className="text-[#444] font-heading text-xs tracking-[0.2em]">NO CUSTOMERS FOUND</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 25 && (
          <div className="px-5 py-4 border-t border-[#1A1A1A] flex items-center justify-between">
            <p className="font-heading text-[10px] tracking-[0.1em] text-[#444]">
              {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} OF {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 font-heading text-[10px] tracking-wider text-[#444] border border-[#1E1E1E] hover:border-[#333] hover:text-ud-white disabled:opacity-30 transition-colors">
                PREV
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
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
