import { NextRequest } from 'next/server'
import { ok, err, requireAuth, requireAdmin, parsePagination } from '@/lib/api-helpers'
import { generateOrderNumber, pointsFromAmount } from '@/lib/utils'

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Customers see their own orders; admins see all orders.

export async function GET(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { searchParams } = request.nextUrl
    const { from, to, page, limit } = parsePagination(searchParams)
    const status = searchParams.get('status') ?? undefined

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items(*),
        address:addresses(*)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!isAdmin) {
      query = query.eq('user_id', user!.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

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
    console.error('GET /api/orders', e)
    return err('Internal server error', 500)
  }
}

// ─── POST /api/orders — create order after payment ───────────────────────────

export async function POST(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const body = await request.json()
    const {
      address_id,
      items,               // [{ variant_id, quantity, price, product_title, size }]
      razorpay_order_id,
      loyalty_points_to_redeem = 0,
      shipping_cost = 0,
      notes,
    } = body

    if (!address_id)           return err('address_id is required')
    if (!items?.length)        return err('Order must contain at least one item')
    if (!razorpay_order_id)    return err('razorpay_order_id is required')

    // Verify address belongs to user
    const { data: address } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', address_id)
      .eq('user_id', user!.id)
      .single()

    if (!address) return err('Address not found', 404)

    // Verify loyalty points balance
    let discount = 0
    if (loyalty_points_to_redeem > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user!.id)
        .single()

      if (!profile || (profile.loyalty_points ?? 0) < loyalty_points_to_redeem) {
        return err('Insufficient loyalty points')
      }

      // 100 points = ₹50 discount
      discount = Math.floor(loyalty_points_to_redeem / 100) * 50
    }

    // Compute totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    )
    const total  = Math.max(0, subtotal + shipping_cost - discount)
    const points = pointsFromAmount(total)

    // Verify stock and lock variants
    for (const item of items) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single()

      if (!variant || (variant.stock ?? 0) < item.quantity) {
        return err(`Insufficient stock for size ${item.size}`, 409)
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number:             generateOrderNumber(),
        user_id:                  user!.id,
        address_id,
        status:                   'pending',
        subtotal,
        shipping_cost,
        discount,
        total,
        razorpay_order_id,
        loyalty_points_earned:    points,
        loyalty_points_redeemed:  loyalty_points_to_redeem,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (orderError) return err(orderError.message)

    // Create order items
    const orderItems = items.map((item: {
      variant_id: string
      product_title: string
      size: string
      quantity: number
      price: number
    }) => ({
      order_id:      order.id,
      variant_id:    item.variant_id,
      product_title: item.product_title,
      size:          item.size,
      quantity:      item.quantity,
      price:         item.price,
      total:         item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      return err('Failed to create order items')
    }

    // Deduct stock
    for (const item of items) {
      await supabase.rpc('decrement_stock', {
        p_variant_id: item.variant_id,
        p_quantity:   item.quantity,
      })
    }

    return ok(order, 201)
  } catch (e) {
    console.error('POST /api/orders', e)
    return err('Internal server error', 500)
  }
}
