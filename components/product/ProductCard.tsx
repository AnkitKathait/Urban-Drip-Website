'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { cn, formatPrice, discountPercent } from '@/lib/utils'
import type { Product, ProductVariant } from '@/types'

function buildImageUrl(url: string): string {
  if (!url) return '/placeholder-product.jpg'
  const t = 'w_600,h_750,c_fill,f_auto,q_auto'
  if (url.includes('cloudinary.com')) return url.replace('/upload/', `/upload/${t}/`)
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${url}`
}

interface ProductCardProps {
  product: Product & { variants?: ProductVariant[] }
}

const COLLECTION_DOT: Record<string, string> = {
  anime:      '#8B5CF6',
  sports:     '#3B82F6',
  streetwear: '#F97316',
  ai:         '#06B6D4',
  gaming:     '#00E87A',
  music:      '#EC4899',
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [imgLoaded,    setImgLoaded]    = useState(false)
  const [added,        setAdded]        = useState(false)
  const { addItem } = useCart()

  const activeVariants = (product.variants ?? []).filter(v => v.is_active && (v.stock ?? 0) > 0)
  const firstVariant   = activeVariants[0]
  const imageUrl       = buildImageUrl(product.images?.[0] ?? '')
  const discount       = firstVariant ? discountPercent(firstVariant.price, firstVariant.mrp) : 0
  const dot            = COLLECTION_DOT[product.collection]

  function handleAddToCart() {
    const variant = activeVariants.find(v => v.size === selectedSize) ?? firstVariant
    if (!variant) return
    addItem({
      variant_id:    variant.id,
      product_id:    product.id,
      product_title: product.title,
      slug:          product.slug,
      size:          variant.size,
      price:         variant.price,
      mrp:           variant.mrp,
      image:         imageUrl,
      quantity:      1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="group bg-[#0C0C0C] flex flex-col">

      {/* ── Image ──────────────────────────────────────────────────────────── */}
      <Link href={`/products/${product.slug}`} className="relative overflow-hidden aspect-[3/4] bg-[#141414] block">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className={cn(
            'object-cover transition-transform duration-500 group-hover:scale-[1.04]',
            imgLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImgLoaded(true)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {!imgLoaded && <div className="absolute inset-0 shimmer" />}

        {/* Badges: top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount >= 20 && (
            <span className="badge-accent text-[9px]">{discount}% OFF</span>
          )}
          {product.fit_type === 'oversized' && (
            <span className="badge-muted text-[9px]">OVERSIZED</span>
          )}
        </div>

        {/* Collection dot: top right */}
        {dot && (
          <div
            className="absolute top-3 right-3 w-2 h-2 rounded-full opacity-70"
            style={{ background: dot }}
            title={product.collection}
          />
        )}

        {/* Quick add overlay */}
        <div className="img-overlay">
          <button
            onClick={e => { e.preventDefault(); handleAddToCart() }}
            disabled={activeVariants.length === 0 || added}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 font-heading text-xs tracking-[0.2em] transition-all duration-150',
              added
                ? 'bg-ud-neon text-ud-black'
                : activeVariants.length > 0
                  ? 'bg-ud-white text-ud-black hover:bg-ud-accent hover:text-white'
                  : 'bg-[#333] text-[#666] cursor-not-allowed'
            )}
          >
            {added ? (
              <><Check className="w-3.5 h-3.5" /> ADDED</>
            ) : activeVariants.length > 0 ? (
              <><ShoppingBag className="w-3.5 h-3.5" /> QUICK ADD</>
            ) : (
              'SOLD OUT'
            )}
          </button>
        </div>
      </Link>

      {/* ── Info ───────────────────────────────────────────────────────────── */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1 border-t border-[#1A1A1A]">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-sans text-[13px] text-[#C0C0C0] hover:text-ud-white transition-colors line-clamp-2 leading-snug font-medium">
            {product.title}
          </h3>
        </Link>

        {firstVariant ? (
          <div className="flex items-center gap-2">
            <span className="font-price text-sm text-ud-neon font-bold">
              {formatPrice(firstVariant.price)}
            </span>
            <span className="font-price text-xs text-[#444] line-through">
              {formatPrice(firstVariant.mrp)}
            </span>
          </div>
        ) : (
          <span className="font-heading text-xs text-[#555] tracking-wider">SOLD OUT</span>
        )}

        {/* Size selector */}
        {activeVariants.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {activeVariants.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedSize(s => s === v.size ? null : v.size)}
                className={cn(
                  'px-2 py-0.5 text-[10px] font-heading tracking-wider border transition-all duration-100',
                  selectedSize === v.size
                    ? 'border-ud-white text-ud-white bg-ud-white/5'
                    : 'border-[#2A2A2A] text-[#555] hover:border-[#444] hover:text-[#888]'
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
