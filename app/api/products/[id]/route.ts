import { NextRequest } from 'next/server'
import { ok, err, requireAdmin } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

// ─── GET /api/products/[id] ───────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Support lookup by slug or UUID
    const isUUID = /^[0-9a-f-]{36}$/.test(id)

    const query = supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)

    const { data, error } = isUUID
      ? await query.eq('id', id).single()
      : await query.eq('slug', id).single()

    if (error || !data) return err('Product not found', 404)

    // Fetch avg rating
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', data.id)
      .eq('status', 'approved')

    const ratings = reviewStats?.map(r => r.rating) ?? []
    const avg_rating   = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    const review_count = ratings.length

    return ok({ ...data, avg_rating, review_count })
  } catch (e) {
    console.error('GET /api/products/[id]', e)
    return err('Internal server error', 500)
  }
}

// ─── PUT /api/products/[id] (admin) ──────────────────────────────────────────

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params
    const body   = await request.json()

    // Strip computed/virtual fields that are not DB columns
    const {
      variants, avg_rating, review_count,
      _variant_price, _variant_mrp, _variant_stock, _variant_sizes,
      ...fields
    } = body

    const { data, error } = await supabase
      .from('products')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message)
    if (!data)  return err('Product not found', 404)

    return ok(data)
  } catch (e) {
    console.error('PUT /api/products/[id]', e)
    return err('Internal server error', 500)
  }
}

// ─── DELETE /api/products/[id] (admin) ───────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params

    // Soft delete — keeps order history intact
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return err(error.message)

    return ok({ message: 'Product deactivated' })
  } catch (e) {
    console.error('DELETE /api/products/[id]', e)
    return err('Internal server error', 500)
  }
}
