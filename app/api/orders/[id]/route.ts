import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { createShiprocketOrder, assignAWB, PICKUP_LOCATION } from '@/lib/shiprocket'
import { pointsFromAmount } from '@/lib/utils'

type Params = Promise<{ id: string }>

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { id } = await params

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    const query = supabase
      .from('orders')
      .select(`*, items:order_items(*), address:addresses(*)`)
      .eq('id', id)

    if (!isAdmin) {
      query.eq('user_id', user!.id)
    }

    const { data, error } = await query.single()

    if (error || !data) return err('Order not found', 404)

    return ok(data)
  } catch (e) {
    console.error('GET /api/orders/[id]', e)
    return err('Internal server error', 500)
  }
}

// ─── PATCH /api/orders/[id] — update status + trigger Shiprocket ─────────────

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { id }    = await params
    const body      = await request.json()
    const { status, razorpay_payment_id } = body

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Customers can only cancel their own pending orders
    if (!isAdmin && status !== 'cancelled') {
      return err('Forbidden', 403)
    }

    // Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`*, items:order_items(*), address:addresses(*)`)
      .eq('id', id)
      .single()

    if (fetchErr || !order) return err('Order not found', 404)

    if (!isAdmin && order.user_id !== user!.id) {
      return err('Forbidden', 403)
    }

    if (!isAdmin && order.status !== 'pending') {
      return err('Only pending orders can be cancelled')
    }

    const updatePayload: {
      status: string
      updated_at: string
      razorpay_payment_id?: string
      shiprocket_order_id?: string
      shiprocket_shipment_id?: string
      tracking_number?: string
      tracking_url?: string
    } = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (razorpay_payment_id) {
      updatePayload.razorpay_payment_id = razorpay_payment_id
    }

    // On confirmation — award loyalty points, create Shiprocket order
    if (status === 'confirmed' && order.status !== 'confirmed') {
      // Award loyalty points
      if ((order.loyalty_points_earned ?? 0) > 0) {
        await supabase.from('loyalty_transactions').insert({
          user_id:     order.user_id,
          order_id:    order.id,
          type:        'earned',
          points:      order.loyalty_points_earned ?? 0,
          description: `Points earned from order ${order.order_number}`,
        })

        await supabase.rpc('increment_loyalty_points', {
          p_user_id: order.user_id!,
          p_points:  order.loyalty_points_earned!,
        })
      }

      // Deduct redeemed points
      if ((order.loyalty_points_redeemed ?? 0) > 0) {
        await supabase.from('loyalty_transactions').insert({
          user_id:     order.user_id,
          order_id:    order.id,
          type:        'redeemed',
          points:      -(order.loyalty_points_redeemed ?? 0),
          description: `Points redeemed for order ${order.order_number}`,
        })

        await supabase.rpc('decrement_loyalty_points', {
          p_user_id: order.user_id!,
          p_points:  order.loyalty_points_redeemed!,
        })
      }

      // Create Shiprocket shipment (non-blocking — don't fail order on Shiprocket error)
      try {
        const addr    = order.address
        if (!addr) throw new Error('No address on order')
        const srOrder = await createShiprocketOrder({
          order_id:              order.order_number,
          order_date:            new Date().toISOString().split('T')[0],
          pickup_location:       PICKUP_LOCATION,
          billing_customer_name: addr.full_name.split(' ')[0],
          billing_last_name:     addr.full_name.split(' ').slice(1).join(' ') || '-',
          billing_address:       addr.address_line1 + (addr.address_line2 ? `, ${addr.address_line2}` : ''),
          billing_city:          addr.city,
          billing_pincode:       addr.pincode,
          billing_state:         addr.state,
          billing_country:       'India',
          billing_email:         user!.email ?? '',
          billing_phone:         addr.phone,
          shipping_is_billing:   true,
          payment_method:        'Prepaid',
          sub_total:             order.total,
          length:                25,
          breadth:               20,
          height:                5,
          weight:                0.5,
          order_items:           order.items.map((item: {
            product_title: string; size: string; price: number; quantity: number
          }) => ({
            name:          `${item.product_title} - ${item.size}`,
            sku:           `${order.order_number}-${item.size}`,
            units:         item.quantity,
            selling_price: item.price,
            discount:      0,
            tax:           0,
            hsn:           610510,
          })),
        })

        const awbResult = await assignAWB(srOrder.shipment_id)

        updatePayload.shiprocket_order_id    = String(srOrder.order_id)
        updatePayload.shiprocket_shipment_id = String(srOrder.shipment_id)
        updatePayload.tracking_number        = awbResult.awb_code
        updatePayload.tracking_url           = `https://shiprocket.co/tracking/${awbResult.awb_code}`
      } catch (srErr) {
        console.error('Shiprocket order creation failed:', srErr)
        // Continue — admin can manually create shipment
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return err(updateErr.message)

    return ok(updated)
  } catch (e) {
    console.error('PATCH /api/orders/[id]', e)
    return err('Internal server error', 500)
  }
}
