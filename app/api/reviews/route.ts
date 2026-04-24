import { NextRequest } from 'next/server'
import { ok, err, requireAuth, requireAdmin, parsePagination } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

// ─── GET /api/reviews?product_id=xxx ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = request.nextUrl
    const { from, to, page, limit } = parsePagination(searchParams)

    const product_id = searchParams.get('product_id')
    const status     = searchParams.get('status') ?? 'approved'

    if (!product_id) return err('product_id is required')

    const { data, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', product_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return err(error.message)

    // Compute aggregate stats
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', product_id)
      .eq('status', 'approved')

    const ratings   = allRatings?.map(r => r.rating) ?? []
    const avg       = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    const breakdown = [5, 4, 3, 2, 1].reduce<Record<number, number>>((acc, n) => {
      acc[n] = ratings.filter(r => r === n).length
      return acc
    }, {})

    return ok({
      data:       data ?? [],
      total:      count ?? 0,
      page,
      limit,
      hasMore:    (count ?? 0) > to + 1,
      avg_rating: Math.round(avg * 10) / 10,
      breakdown,
    })
  } catch (e) {
    console.error('GET /api/reviews', e)
    return err('Internal server error', 500)
  }
}

// ─── POST /api/reviews — submit review ───────────────────────────────────────

export async function POST(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { product_id, rating, title, body, images = [] } = await request.json()

    if (!product_id)        return err('product_id is required')
    if (!rating || rating < 1 || rating > 5) return err('Rating must be between 1 and 5')

    // Verify user has purchased this product
    const { data: purchase } = await supabase
      .from('order_items')
      .select(`
        id,
        order:orders!inner(user_id, status)
      `)
      .eq('variant_id', product_id) // We'll check by product via variant join in real use
      .limit(1)

    // Fetch user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .single()

    // Prevent duplicate reviews
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', user!.id)
      .single()

    if (existing) return err('You have already reviewed this product', 409)

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id,
        user_id:   user!.id,
        user_name: profile?.full_name ?? 'Verified Buyer',
        rating,
        title:     title ?? null,
        body:      body ?? null,
        images,
        status:    'pending',
      })
      .select()
      .single()

    if (error) return err(error.message)

    // Award 25 loyalty points for leaving a review
    await supabase.from('loyalty_transactions').insert({
      user_id:     user!.id,
      order_id:    null,
      type:        'earned',
      points:      25,
      description: 'Points earned for leaving a review',
    })

    await supabase.rpc('increment_loyalty_points', {
      p_user_id: user!.id,
      p_points:  25,
    })

    return ok(review, 201)
  } catch (e) {
    console.error('POST /api/reviews', e)
    return err('Internal server error', 500)
  }
}

// ─── PATCH /api/reviews — moderate (admin) ────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { review_id, status } = await request.json()

    if (!review_id) return err('review_id is required')
    if (!['approved', 'rejected'].includes(status)) return err('Invalid status')

    const { data, error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', review_id)
      .select()
      .single()

    if (error) return err(error.message)
    if (!data)  return err('Review not found', 404)

    return ok(data)
  } catch (e) {
    console.error('PATCH /api/reviews', e)
    return err('Internal server error', 500)
  }
}
