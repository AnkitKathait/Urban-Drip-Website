import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── POST /api/payments/webhook ───────────────────────────────────────────────
// Razorpay sends events here. Must verify the signature before acting.

export async function POST(request: NextRequest) {
  try {
    const rawBody  = await request.text()
    const signature = request.headers.get('x-razorpay-signature') ?? ''

    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody) as {
      event: string
      payload: {
        payment?: {
          entity: {
            id:       string
            order_id: string
            status:   string
            amount:   number
          }
        }
      }
    }

    const supabase = createAdminClient()

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment?.entity
        if (!payment) break

        // Find the order by razorpay_order_id
        const { data: order } = await supabase
          .from('orders')
          .select('id, status, user_id')
          .eq('razorpay_order_id', payment.order_id)
          .single()

        if (!order || order.status !== 'pending') break

        // Mark as confirmed — PATCH /api/orders/[id] handles loyalty + Shiprocket
        await supabase
          .from('orders')
          .update({
            status:               'confirmed',
            razorpay_payment_id:  payment.id,
            updated_at:           new Date().toISOString(),
          })
          .eq('id', order.id)

        // Award loyalty + create Shiprocket shipment via the orders PATCH logic
        // We call the internal logic directly here for the webhook path
        if (order.user_id) await handleOrderConfirmation(order.id, order.user_id, supabase)

        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment?.entity
        if (!payment) break

        await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('razorpay_order_id', payment.order_id)
          .eq('status', 'pending')

        break
      }

      default:
        // Unhandled event — acknowledge receipt
        break
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('POST /api/payments/webhook', e)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// ─── Internal: post-confirmation side effects ─────────────────────────────────

async function handleOrderConfirmation(
  orderId: string,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('*, items:order_items(*), address:addresses(*)')
      .eq('id', orderId)
      .single()

    if (!order) return

    // Award loyalty points
    if (order.loyalty_points_earned > 0) {
      await supabase.from('loyalty_transactions').insert({
        user_id:     userId,
        order_id:    orderId,
        type:        'earned',
        points:      order.loyalty_points_earned,
        description: `Points earned from order ${order.order_number}`,
      })

      await supabase.rpc('increment_loyalty_points', {
        p_user_id: userId,
        p_points:  order.loyalty_points_earned,
      })
    }

    // Check if first order — bonus 50 points
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'confirmed')

    if (count === 1) {
      await supabase.from('loyalty_transactions').insert({
        user_id:     userId,
        order_id:    orderId,
        type:        'earned',
        points:      50,
        description: 'First order bonus',
      })

      await supabase.rpc('increment_loyalty_points', {
        p_user_id: userId,
        p_points:  50,
      })
    }

    // Clear cart after successful order
    const variantIds = order.items.map((item: { variant_id: string }) => item.variant_id)
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .in('variant_id', variantIds)
  } catch (e) {
    console.error('handleOrderConfirmation failed:', e)
  }
}
