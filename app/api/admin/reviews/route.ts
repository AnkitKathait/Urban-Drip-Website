import { NextRequest } from 'next/server'
import { ok, err, requireAdmin } from '@/lib/api-helpers'

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const status = request.nextUrl.searchParams.get('status') ?? 'pending'

    const { data, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products!reviews_product_id_fkey(id, title, slug, images)
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) return err(error.message)
    return ok({ data: data ?? [], total: count ?? 0 })
  } catch (e) {
    console.error('GET /api/admin/reviews', e)
    return err('Internal server error', 500)
  }
}

// ─── PATCH /api/admin/reviews — approve or reject ────────────────────────────
export async function PATCH(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { review_id, status } = await request.json()
    if (!review_id || !['approved', 'rejected'].includes(status)) {
      return err('review_id and status (approved|rejected) required')
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', review_id)
      .select()
      .single()

    if (error) return err(error.message)
    return ok(data)
  } catch (e) {
    console.error('PATCH /api/admin/reviews', e)
    return err('Internal server error', 500)
  }
}
