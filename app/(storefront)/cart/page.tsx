'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { formatPrice, discountPercent } from '@/lib/utils'
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, itemCount } = useCart()

  const shipping = subtotal >= 999 ? 0 : 99
  const total    = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="ud-container py-24 text-center">
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-ud-gray rounded-full">
          <ShoppingBag className="w-10 h-10 text-ud-muted" />
        </div>
        <h1 className="font-bebas text-4xl text-ud-white mb-3">YOUR CART IS EMPTY</h1>
        <p className="text-ud-muted mb-10">Looks like you haven't added anything yet.</p>
        <Link href="/products" className="btn-primary inline-flex items-center gap-2">
          EXPLORE PRODUCTS <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="ud-container py-12">
      <div className="mb-8">
        <p className="font-mono text-xs text-ud-accent tracking-[0.3em] mb-2">CHECKOUT</p>
        <h1 className="font-bebas text-5xl text-ud-white">
          YOUR CART <span className="text-ud-muted text-2xl">({itemCount} items)</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Items ─────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => {
            const disc = discountPercent(item.price, item.mrp)
            return (
              <div key={item.variant_id} className="flex gap-4 p-4 bg-ud-dark border border-ud-gray rounded-sm hover:border-ud-gray/80 transition-colors">
                <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="relative w-24 h-28 bg-ud-gray rounded-sm overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.product_title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-heading text-sm text-ud-white hover:text-ud-accent transition-colors line-clamp-2 tracking-wide">
                        {item.product_title}
                      </Link>
                      <p className="font-mono text-xs text-ud-muted mt-1">SIZE: {item.size}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variant_id)}
                      className="flex-shrink-0 p-1.5 text-ud-muted hover:text-ud-accent transition-colors rounded-sm"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    {/* Qty controls */}
                    <div className="flex items-center border border-ud-gray rounded-sm overflow-hidden">
                      <button
                        onClick={() => updateQty(item.variant_id, item.quantity - 1)}
                        className="px-3 py-1.5 text-ud-muted hover:text-ud-white hover:bg-ud-gray transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1.5 font-mono text-sm text-ud-white border-x border-ud-gray min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                        className="px-3 py-1.5 text-ud-muted hover:text-ud-white hover:bg-ud-gray transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-price text-lg text-ud-neon font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {disc > 0 && (
                        <p className="font-mono text-xs text-ud-muted line-through">
                          {formatPrice(item.mrp * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-ud-muted hover:text-ud-accent transition-colors font-mono tracking-wider pt-2"
          >
            ← CONTINUE SHOPPING
          </Link>
        </div>

        {/* ── Order summary ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-ud-dark border border-ud-gray rounded-sm p-6 space-y-4">
            <h2 className="font-heading text-base text-ud-white tracking-wider">ORDER SUMMARY</h2>

            <div className="divider" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ud-muted">Subtotal</span>
                <span className="font-price text-ud-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ud-muted">Shipping</span>
                <span className={cn('font-price', shipping === 0 ? 'text-ud-neon' : 'text-ud-white')}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <div className="flex items-start gap-2 p-3 bg-ud-accent/10 border border-ud-accent/20 rounded-sm">
                  <Tag className="w-4 h-4 text-ud-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-ud-accent">
                    Add {formatPrice(999 - subtotal)} more for free shipping!
                  </p>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="flex justify-between items-center">
              <span className="font-heading text-sm text-ud-white tracking-wider">TOTAL</span>
              <span className="font-price text-2xl text-ud-neon font-bold">{formatPrice(total)}</span>
            </div>

            <Link href="/checkout" className="btn-primary w-full text-center flex items-center justify-center gap-2">
              PROCEED TO CHECKOUT <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Trust */}
            <div className="space-y-2 pt-2">
              {[
                '🔒 Secure payment via Razorpay',
                '📦 Ships within 24 hours',
                '↩️ Easy 7-day returns',
              ].map(text => (
                <p key={text} className="text-xs text-ud-muted font-mono">{text}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
