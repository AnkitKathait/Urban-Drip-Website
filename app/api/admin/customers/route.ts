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
      .from('profiles')
      .select('id, full_name, phone, loyalty_points, created_at, role', { count: 'exact' })
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    const { data: profiles, error, count } = await query
    if (error) return err(error.message)

    // Fetch order counts + totals for each customer in one query
    const ids = (profiles ?? []).map(p => p.id)
    const { data: orderStats } = ids.length
      ? await supabase
          .from('orders')
          .select('user_id, total')
          .in('user_id', ids)
          .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
      : { data: [] }

    const statsMap: Record<string, { orders: number; spent: number }> = {}
    for (const o of orderStats ?? []) {
      if (!o.user_id) continue
      if (!statsMap[o.user_id]) statsMap[o.user_id] = { orders: 0, spent: 0 }
      statsMap[o.user_id].orders += 1
      statsMap[o.user_id].spent  += o.total ?? 0
    }

    const enriched = (profiles ?? []).map(p => ({
      ...p,
      order_count: statsMap[p.id]?.orders ?? 0,
      total_spent: statsMap[p.id]?.spent  ?? 0,
    }))

    return ok({
      data:    enriched,
      total:   count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > to + 1,
    })
  } catch (e) {
    console.error('GET /api/admin/customers', e)
    return err('Internal server error', 500)
  }
}
