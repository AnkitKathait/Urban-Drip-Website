'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, ToggleLeft, ToggleRight, Edit } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { Product, ProductVariant } from '@/types'

type AdminProduct = Product & { variants: ProductVariant[] }

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [total,    setTotal]    = useState(0)
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '20' })
    if (search) params.set('search', search)
    const r = await fetch(`/api/admin/products?${params}`)
    const j = await r.json()
    if (j.data) {
      setProducts(j.data.data ?? [])
      setTotal(j.data.total ?? 0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function toggleActive(product: AdminProduct) {
    setToggling(product.id)
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !product.is_active }),
    })
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    setToggling(null)
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ud-white">PRODUCTS</h1>
          <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">{total} TOTAL</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-ud-accent text-white font-heading text-xs tracking-[0.15em] hover:bg-[#e01e1e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          NEW PRODUCT
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full bg-[#111] border border-[#1E1E1E] pl-10 pr-4 py-2.5 text-sm font-sans text-ud-white placeholder:text-[#333] focus:outline-none focus:border-[#333]"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#1E1E1E]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                {['PRODUCT', 'COLLECTION', 'SIZES', 'PRICE', 'STOCK', 'ACTIVE', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-heading text-[10px] tracking-[0.15em] text-[#333]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-[#141414] animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-[#1A1A1A] rounded-none" style={{ width: `${40 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.map(product => {
                const activeVariants = (product.variants ?? []).filter(v => v.is_active)
                const totalStock     = activeVariants.reduce((s, v) => s + (v.stock ?? 0), 0)
                const minPrice       = activeVariants.length ? Math.min(...activeVariants.map(v => v.price)) : 0

                return (
                  <tr key={product.id} className="border-b border-[#141414] hover:bg-[#141414] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <div className="w-10 h-10 relative flex-shrink-0 bg-[#1A1A1A] overflow-hidden">
                            <Image
                              src={product.images[0].includes('cloudinary') ? product.images[0] : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_80,h_80,c_fill/${product.images[0]}`}
                              alt={product.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-[#1A1A1A] flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm text-[#C0C0C0] font-sans font-medium line-clamp-1">{product.title}</p>
                          <p className="font-heading text-[10px] text-[#444] tracking-wider">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'font-heading text-[10px] tracking-[0.12em] px-2 py-0.5',
                        product.collection === 'anime'      ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' :
                        product.collection === 'sports'     ? 'text-[#3B82F6] bg-[#3B82F6]/10' :
                        product.collection === 'ai'         ? 'text-[#06B6D4] bg-[#06B6D4]/10' :
                        product.collection === 'gaming'     ? 'text-[#00E87A] bg-[#00E87A]/10' :
                        product.collection === 'music'      ? 'text-[#EC4899] bg-[#EC4899]/10' :
                        'text-[#F97316] bg-[#F97316]/10'
                      )}>
                        {product.collection.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-0.5">
                        {activeVariants.map(v => (
                          <span key={v.id} className="font-heading text-[9px] text-[#555] border border-[#2A2A2A] px-1 py-0.5">{v.size}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-price text-sm text-ud-neon">{minPrice ? formatPrice(minPrice) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'font-heading text-[11px] tracking-wider',
                        totalStock === 0 ? 'text-ud-accent' : totalStock < 20 ? 'text-[#F97316]' : 'text-[#555]'
                      )}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(product)}
                        disabled={toggling === product.id}
                        className="text-[#444] hover:text-ud-white transition-colors disabled:opacity-50"
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active
                          ? <ToggleRight className="w-5 h-5 text-ud-neon" />
                          : <ToggleLeft className="w-5 h-5" />
                        }
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-1.5 font-heading text-[10px] tracking-[0.1em] text-[#444] hover:text-ud-white transition-colors"
                      >
                        <Edit className="w-3 h-3" /> EDIT
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <p className="px-5 py-10 text-[#444] text-sm font-sans text-center">No products found.</p>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-5 py-4 border-t border-[#1A1A1A] flex items-center justify-between">
            <p className="font-heading text-[10px] tracking-[0.1em] text-[#444]">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} OF {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 font-heading text-[10px] tracking-wider text-[#444] border border-[#1E1E1E] hover:border-[#333] hover:text-ud-white disabled:opacity-30 transition-colors"
              >
                PREV
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 font-heading text-[10px] tracking-wider text-[#444] border border-[#1E1E1E] hover:border-[#333] hover:text-ud-white disabled:opacity-30 transition-colors"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
