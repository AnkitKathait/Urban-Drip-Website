'use client'

import { useEffect, useState } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/types'

interface InventoryProduct {
  id: string
  title: string
  slug: string
  collection: string
  is_active: boolean
  images: string[]
  variants: ProductVariant[]
}

export default function InventoryPage() {
  const [products,  setProducts]  = useState<InventoryProduct[]>([])
  const [loading,   setLoading]   = useState(true)
  const [dirty,     setDirty]     = useState<Record<string, number>>({})
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [filter,    setFilter]    = useState<'all' | 'low'>('all')

  useEffect(() => {
    fetch('/api/admin/inventory')
      .then(r => r.json())
      .then(r => { if (r.data) setProducts(r.data) })
      .finally(() => setLoading(false))
  }, [])

  function updateStock(variantId: string, value: number) {
    setDirty(d => ({ ...d, [variantId]: value }))
  }

  async function saveAll() {
    const updates = Object.entries(dirty).map(([variant_id, stock]) => ({ variant_id, stock }))
    if (!updates.length) return
    setSaving(true)
    await fetch('/api/admin/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    // Apply to local state
    setProducts(ps => ps.map(p => ({
      ...p,
      variants: p.variants.map(v => dirty[v.id] !== undefined ? { ...v, stock: dirty[v.id] } : v),
    })))
    setDirty({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const displayedProducts = products.filter(p => {
    if (!p.is_active) return false
    if (filter === 'low') return p.variants.some(v => v.is_active && (v.stock ?? 0) < 10)
    return true
  })

  const totalLowStock = products.reduce((n, p) =>
    n + p.variants.filter(v => v.is_active && (v.stock ?? 0) < 10).length, 0)

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ud-white">INVENTORY</h1>
          <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">
            {totalLowStock > 0 && <span className="text-[#F97316] mr-2">{totalLowStock} LOW STOCK</span>}
            STOCK MANAGEMENT
          </p>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(dirty).length > 0 && (
            <span className="font-heading text-[10px] tracking-wider text-[#F97316]">
              {Object.keys(dirty).length} UNSAVED
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={saving || Object.keys(dirty).length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-ud-neon text-ud-black font-heading text-xs tracking-[0.15em] hover:brightness-110 disabled:opacity-40 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'SAVED!' : saving ? 'SAVING...' : 'SAVE ALL'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {([['all', 'ALL PRODUCTS'], ['low', 'LOW STOCK ONLY']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={cn(
              'px-4 py-2 font-heading text-[10px] tracking-[0.12em] border transition-all',
              filter === val
                ? 'border-ud-white text-ud-white bg-ud-white/5'
                : 'border-[#1E1E1E] text-[#444] hover:border-[#333]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[#111] border border-[#1E1E1E]" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedProducts.map(product => (
            <div key={product.id} className="bg-[#111] border border-[#1E1E1E]">
              {/* Product row */}
              <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1A1A1A]">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  product.collection === 'anime' ? 'bg-[#8B5CF6]' :
                  product.collection === 'gymwear' ? 'bg-[#3B82F6]' : 'bg-[#F97316]'
                )} />
                <h3 className="text-sm text-[#C0C0C0] font-sans font-medium flex-1 truncate">{product.title}</h3>
                {product.variants.some(v => v.is_active && (v.stock ?? 0) === 0) && (
                  <span className="font-heading text-[9px] tracking-wider text-ud-accent flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> OUT OF STOCK
                  </span>
                )}
              </div>

              {/* Variants grid */}
              <div className="flex flex-wrap gap-4 px-5 py-4">
                {product.variants.filter(v => v.is_active).map(v => {
                  const currentStock = dirty[v.id] ?? v.stock ?? 0
                  const isLow = currentStock < 10
                  const isOOS = currentStock === 0
                  return (
                    <div key={v.id} className="flex flex-col items-center gap-1.5">
                      <span className="font-heading text-[10px] tracking-wider text-[#555]">{v.size}</span>
                      <input
                        type="number"
                        min={0}
                        value={currentStock}
                        onChange={e => updateStock(v.id, Number(e.target.value))}
                        className={cn(
                          'w-16 py-1.5 text-center font-heading text-sm border bg-[#0A0A0A] focus:outline-none transition-colors',
                          dirty[v.id] !== undefined
                            ? 'border-[#F97316]/50 text-[#F97316]'
                            : isOOS
                            ? 'border-ud-accent/50 text-ud-accent'
                            : isLow
                            ? 'border-[#F97316]/30 text-[#F97316]'
                            : 'border-[#2A2A2A] text-[#888]'
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {displayedProducts.length === 0 && (
            <p className="py-10 text-center text-[#444] text-sm font-sans">No products match the filter.</p>
          )}
        </div>
      )}
    </div>
  )
}
