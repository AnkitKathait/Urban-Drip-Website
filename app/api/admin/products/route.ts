import { NextRequest } from 'next/server'
import { ok, err, requireAdmin, parsePagination } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { searchParams } = request.nextUrl
    const { from, to, page, limit } = parsePagination(searchParams)
    const search = searchParams.get('search') ?? ''

    let query = supabase
      .from('products')
      .select(
        `*, variants:product_variants(id, size, price, mrp, stock, is_active, sku)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
    if (error) return err(error.message)

    return ok({
      data:    data ?? [],
      total:   count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > to + 1,
    })
  } catch (e) {
    console.error('GET /api/admin/products', e)
    return err('Internal server error', 500)
  }
}
