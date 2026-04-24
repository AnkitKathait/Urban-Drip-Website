'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, itemCount } = useCart()

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-ud-dark border-l border-ud-gray flex flex-col animate-slide-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ud-gray">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-ud-accent" />
            <span className="font-heading text-lg tracking-wider">YOUR CART</span>
            {itemCount > 0 && (
              <span className="font-mono text-xs text-ud-muted">({itemCount} items)</span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-ud-muted hover:text-ud-white transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
              <ShoppingBag className="w-16 h-16 text-ud-gray" />
              <div>
                <p className="font-heading text-xl text-ud-white mb-2">YOUR CART IS EMPTY</p>
                <p className="text-ud-muted text-sm">Add some legendary drip to get started.</p>
              </div>
              <Button onClick={closeCart} variant="secondary" size="sm">
                CONTINUE SHOPPING
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-ud-gray">
              {items.map(item => (
                <div key={item.variant_id} className="flex gap-4 p-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative w-20 h-24 flex-shrink-0 bg-ud-gray rounded-sm overflow-hidden"
                  >
                    <Image
                      src={item.image}
                      alt={item.product_title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="font-heading text-sm text-ud-white hover:text-ud-accent transition-colors line-clamp-2 leading-tight block mb-1"
                    >
                      {item.product_title}
                    </Link>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-xs text-ud-muted px-1.5 py-0.5 bg-ud-gray rounded-sm">
                        {item.size}
                      </span>
                      <span className="price-sale text-sm">{formatPrice(item.price)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center border border-ud-gray rounded-sm overflow-hidden">
                        <button
                          onClick={() => updateQty(item.variant_id, item.quantity - 1)}
                          className="p-1.5 text-ud-muted hover:text-ud-white hover:bg-ud-gray transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 font-mono text-sm text-ud-white border-x border-ud-gray">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="p-1.5 text-ud-muted hover:text-ud-white hover:bg-ud-gray transition-colors disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-ud-white">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.variant_id)}
                          className="text-ud-muted hover:text-ud-accent transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ud-gray p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm text-ud-muted tracking-wider">SUBTOTAL</span>
              <span className="font-mono text-xl text-ud-white">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-ud-muted">Shipping & taxes calculated at checkout</p>

            <Link href="/checkout" onClick={closeCart}>
              <Button className="w-full" size="lg">
                CHECKOUT <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center text-sm text-ud-muted hover:text-ud-white transition-colors"
            >
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
