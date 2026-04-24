'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingBag, Star, ChevronLeft, ChevronRight, Zap, Truck, RotateCcw } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { Badge }   from '@/components/ui/Badge'
import { Button }  from '@/components/ui/Button'
import { cn, formatPrice, discountPercent } from '@/lib/utils'
import type { Product, ProductVariant, Review } from '@/types'

function buildImageUrl(url: string, preset: 'detail' | 'zoom' = 'detail'): string {
  if (!url) return '/placeholder-product.jpg'
  const t = preset === 'zoom' ? 'w_1200,f_auto,q_auto' : 'w_800,f_auto,q_auto'
  if (url.includes('cloudinary.com')) return url.replace('/upload/', `/upload/${t}/`)
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${url}`
}

interface Props {
  product: Product & { variants: ProductVariant[]; avg_rating: number; review_count: number }
  reviews: Review[]
}

export function ProductDetail({ product, reviews }: Props) {
  const [activeImg,  setActiveImg]  = useState(0)
  const [selectedV,  setSelectedV]  = useState<ProductVariant | null>(
    product.variants.find(v => v.is_active && v.stock > 0) ?? null
  )
  const [qty,        setQty]        = useState(1)
  const [tab,        setTab]        = useState<'details' | 'reviews'>('details')
  const { addItem } = useCart()

  const images         = product.images?.length ? product.images : ['/placeholder-product.jpg']
  const activeVariants = product.variants.filter(v => v.is_active)
  const discount       = selectedV ? discountPercent(selectedV.price, selectedV.mrp) : 0

  function handleAddToCart() {
    if (!selectedV) return
    addItem({
      variant_id:    selectedV.id,
      product_id:    product.id,
      product_title: product.title,
      slug:          product.slug,
      size:          selectedV.size,
      price:         selectedV.price,
      mrp:           selectedV.mrp,
      image:         buildImageUrl(images[0], 'detail'),
      quantity:      qty,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* ── Gallery ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Main image */}
        <div className="relative aspect-[4/5] bg-ud-gray rounded-sm overflow-hidden group">
          <Image
            src={buildImageUrl(images[activeImg], 'detail')}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-ud-black/70 text-white rounded-sm hover:bg-ud-accent transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveImg(i => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-ud-black/70 text-white rounded-sm hover:bg-ud-accent transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount >= 20 && <Badge variant="accent">{discount}% OFF</Badge>}
            {product.fit_type === 'oversized' && <Badge variant="muted">OVERSIZED</Badge>}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={cn(
                  'relative w-20 h-24 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all',
                  activeImg === i ? 'border-ud-accent' : 'border-ud-gray hover:border-ud-muted'
                )}
              >
                <Image src={buildImageUrl(img, 'detail')} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Info ────────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Collection badge */}
        <div>
          <Badge variant={product.collection === 'anime' ? 'purple' : product.collection === 'sports' ? 'blue' : product.collection === 'ai' ? 'blue' : product.collection === 'gaming' ? 'neon' : 'orange'}>
            {product.collection.toUpperCase()}
          </Badge>
        </div>

        <h1 className="font-bebas text-4xl md:text-5xl text-ud-white leading-none">
          {product.title}
        </h1>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={cn('w-4 h-4', n <= Math.round(product.avg_rating) ? 'fill-ud-gold text-ud-gold' : 'text-ud-gray')}
                />
              ))}
            </div>
            <button
              onClick={() => setTab('reviews')}
              className="font-mono text-sm text-ud-muted hover:text-ud-white transition-colors"
            >
              {product.avg_rating.toFixed(1)} ({product.review_count} reviews)
            </button>
          </div>
        )}

        {/* Price */}
        {selectedV && (
          <div className="flex items-center gap-4">
            <span className="font-price text-3xl text-ud-neon font-bold">{formatPrice(selectedV.price)}</span>
            <span className="font-price text-lg text-ud-muted line-through">{formatPrice(selectedV.mrp)}</span>
            {discount > 0 && (
              <span className="badge-accent text-sm">{discount}% OFF</span>
            )}
          </div>
        )}

        <div className="divider" />

        {/* Size selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="input-label">SELECT SIZE</p>
            {selectedV && (
              <span className="font-mono text-xs text-ud-muted">
                {selectedV.stock < 10 ? `Only ${selectedV.stock} left!` : 'In stock'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map(v => {
              const outOfStock = v.stock === 0
              return (
                <button
                  key={v.id}
                  onClick={() => !outOfStock && setSelectedV(v)}
                  disabled={outOfStock}
                  className={cn(
                    'w-14 h-12 font-mono text-sm border rounded-sm transition-all duration-150',
                    outOfStock
                      ? 'border-ud-gray text-ud-gray cursor-not-allowed line-through'
                      : selectedV?.id === v.id
                      ? 'border-ud-accent bg-ud-accent text-white'
                      : 'border-ud-gray text-ud-muted hover:border-ud-white hover:text-ud-white'
                  )}
                >
                  {v.size}
                </button>
              )
            })}
          </div>
          {!selectedV && (
            <p className="mt-2 text-xs text-ud-accent">Please select a size</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <p className="input-label mb-3">QUANTITY</p>
          <div className="flex items-center border border-ud-gray rounded-sm w-fit overflow-hidden">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-ud-muted hover:text-ud-white hover:bg-ud-gray transition-colors">−</button>
            <span className="px-5 py-3 font-mono text-ud-white border-x border-ud-gray">{qty}</span>
            <button onClick={() => setQty(q => Math.min(10, q + 1))} className="px-4 py-3 text-ud-muted hover:text-ud-white hover:bg-ud-gray transition-colors">+</button>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={!selectedV || selectedV.stock === 0}
            className="flex-1"
            size="lg"
          >
            <ShoppingBag className="w-5 h-5" />
            {selectedV?.stock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
          </Button>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: Zap,        text: 'Ships in 24hrs'     },
            { icon: Truck,      text: 'Free above ₹999'    },
            { icon: RotateCcw,  text: 'Easy 7-day returns' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-1.5 p-3 bg-ud-gray/50 rounded-sm text-center">
              <Icon className="w-4 h-4 text-ud-muted" />
              <span className="text-[10px] font-mono text-ud-muted leading-tight">{text}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Tabs */}
        <div>
          <div className="flex border-b border-ud-gray mb-6">
            {(['details', 'reviews'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 pb-3 font-heading text-sm tracking-wider transition-colors border-b-2',
                  tab === t
                    ? 'text-ud-accent border-ud-accent'
                    : 'text-ud-muted border-transparent hover:text-ud-white'
                )}
              >
                {t === 'details' ? 'PRODUCT DETAILS' : `REVIEWS (${product.review_count})`}
              </button>
            ))}
          </div>

          {tab === 'details' ? (
            <div className="space-y-4">
              {product.description && (
                <p className="text-ud-muted text-sm leading-relaxed">{product.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Material',   product.material    ],
                  ['Fit',        product.fit_type === 'oversized' ? 'Oversized' : 'Regular'],
                  ['Neck Style', product.neck_style  ],
                  ['Sleeve',     product.sleeve_type ],
                  ['Color',      product.color       ],
                  ['HSN Code',   product.hsn_code    ],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 bg-ud-gray/40 rounded-sm">
                    <p className="text-ud-muted text-xs font-mono mb-0.5">{label}</p>
                    <p className="text-ud-white font-sans">{value}</p>
                  </div>
                ))}
              </div>
              {product.bullet_points?.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {product.bullet_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ud-muted">
                      <span className="text-ud-accent mt-0.5">›</span> {pt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-ud-muted text-sm">No reviews yet. Be the first!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="p-4 bg-ud-gray/40 rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm text-ud-white">{review.user_name}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={cn('w-3.5 h-3.5', n <= review.rating ? 'fill-ud-gold text-ud-gold' : 'text-ud-gray')} />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-sans text-sm font-medium text-ud-white">{review.title}</p>}
                    {review.body  && <p className="text-ud-muted text-sm leading-relaxed">{review.body}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
