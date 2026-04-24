'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminReview {
  id: string
  product_id: string
  user_id: string
  user_name: string
  rating: number
  title: string | null
  body: string | null
  images: string[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  product: {
    id: string
    title: string
    slug: string
    images: string[]
  } | null
}

const STATUS_TABS = ['pending', 'approved', 'rejected'] as const

export default function ReviewsPage() {
  const [reviews,  setReviews]  = useState<AdminReview[]>([])
  const [total,    setTotal]    = useState(0)
  const [status,   setStatus]   = useState<typeof STATUS_TABS[number]>('pending')
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/reviews?status=${status}`)
    const j = await r.json()
    if (j.data) {
      setReviews(j.data.data ?? [])
      setTotal(j.data.total ?? 0)
    }
    setLoading(false)
  }, [status])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  async function moderate(reviewId: string, action: 'approved' | 'rejected') {
    setActing(reviewId)
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, status: action }),
    })
    setReviews(rs => rs.filter(r => r.id !== reviewId))
    setTotal(t => t - 1)
    setActing(null)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ud-white">REVIEWS</h1>
        <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">{total} {status.toUpperCase()}</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={cn(
              'px-4 py-2 font-heading text-[10px] tracking-[0.12em] border transition-all',
              status === tab
                ? 'border-ud-white text-ud-white bg-ud-white/5'
                : 'border-[#1E1E1E] text-[#444] hover:border-[#333]'
            )}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-[#111] border border-[#1E1E1E]" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-8 h-8 text-[#2A2A2A] mx-auto mb-3" />
          <p className="text-[#444] font-heading text-xs tracking-[0.2em]">NO {status.toUpperCase()} REVIEWS</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-[#111] border border-[#1E1E1E] p-5">
              <div className="flex gap-4">
                {/* Product image */}
                {review.product?.images?.[0] && (
                  <Link href={`/products/${review.product.slug}`} className="flex-shrink-0">
                    <div className="w-16 h-16 relative bg-[#1A1A1A] overflow-hidden">
                      <Image
                        src={review.product.images[0]}
                        alt={review.product.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </Link>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <Link
                        href={`/products/${review.product?.slug ?? ''}`}
                        className="font-heading text-[10px] tracking-[0.15em] text-[#444] hover:text-ud-white transition-colors"
                      >
                        {review.product?.title ?? 'Unknown Product'}
                      </Link>
                      <p className="font-sans text-sm text-[#C0C0C0] font-medium mt-0.5">{review.user_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={cn('w-3 h-3', i <= review.rating ? 'text-[#C9A227] fill-[#C9A227]' : 'text-[#2A2A2A]')} />
                        ))}
                      </div>
                    </div>
                    <p className="font-heading text-[10px] text-[#444] tracking-wider flex-shrink-0">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>

                  {review.title && (
                    <p className="text-sm text-[#C0C0C0] font-sans font-medium mt-2">{review.title}</p>
                  )}
                  {review.body && (
                    <p className="text-sm text-[#888] font-sans mt-1 line-clamp-3">{review.body}</p>
                  )}

                  {/* Review images */}
                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <div key={i} className="w-12 h-12 relative bg-[#1A1A1A] overflow-hidden">
                          <Image src={img} alt={`Review image ${i + 1}`} fill className="object-cover" sizes="48px" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => moderate(review.id, 'approved')}
                        disabled={acting === review.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-ud-neon/10 text-ud-neon border border-ud-neon/20 font-heading text-[10px] tracking-[0.12em] hover:bg-ud-neon/20 disabled:opacity-50 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> APPROVE
                      </button>
                      <button
                        onClick={() => moderate(review.id, 'rejected')}
                        disabled={acting === review.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-ud-accent/10 text-ud-accent border border-ud-accent/20 font-heading text-[10px] tracking-[0.12em] hover:bg-ud-accent/20 disabled:opacity-50 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> REJECT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
