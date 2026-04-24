import { ok, err, requireAdmin } from '@/lib/api-helpers'

export async function GET() {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const PAID = ['confirmed', 'processing', 'shipped', 'delivered']

    const [
      { data: allOrders },
      { data: todayOrders },
      { data: pendingOrders },
      { data: lowStock },
      { count: customerCount },
      { data: recentOrders },
      { data: revenueSeries },
    ] = await Promise.all([
      supabase.from('orders').select('total').in('status', PAID),
      supabase.from('orders').select('total').gte('created_at', todayISO).in('status', PAID),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('product_variants')
        .select('id, size, stock, product_id, products!product_variants_product_id_fkey(title, images)')
        .lt('stock', 10)
        .eq('is_active', true)
        .order('stock', { ascending: true })
        .limit(8),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase
        .from('orders')
        .select('id, order_number, status, total, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('orders')
        .select('total, created_at')
        .in('status', PAID)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
    ])

    const totalRevenue  = (allOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
    const revenueToday  = (todayOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
    const totalOrders   = (allOrders ?? []).length
    const ordersToday   = (todayOrders ?? []).length
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    // Group revenue by day (last 14 days)
    const dayMap: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      dayMap[d.toISOString().slice(0, 10)] = { revenue: 0, orders: 0 }
    }
    for (const o of revenueSeries ?? []) {
      const day = (o.created_at as string).slice(0, 10)
      if (dayMap[day]) {
        dayMap[day].revenue += o.total ?? 0
        dayMap[day].orders  += 1
      }
    }
    const revenueChart = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }))

    return ok({
      stats: {
        total_revenue:   totalRevenue,
        revenue_today:   revenueToday,
        total_orders:    totalOrders,
        orders_today:    ordersToday,
        pending_orders:  pendingOrders ?? 0,
        total_customers: customerCount ?? 0,
        low_stock_count: (lowStock ?? []).length,
        avg_order_value: avgOrderValue,
      },
      recent_orders: recentOrders ?? [],
      low_stock:     lowStock ?? [],
      revenue_chart: revenueChart,
    })
  } catch (e) {
    console.error('GET /api/admin/dashboard', e)
    return err('Internal server error', 500)
  }
}
