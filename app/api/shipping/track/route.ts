import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { trackShipment } from '@/lib/shiprocket'

// ─── GET /api/shipping/track?awb=XXXXXXXXXX ───────────────────────────────────

export async function GET(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const awb      = request.nextUrl.searchParams.get('awb')
    const order_id = request.nextUrl.searchParams.get('order_id')

    if (!awb && !order_id) return err('awb or order_id is required')

    let trackingNumber = awb

    // If order_id provided, look up the AWB from the DB
    if (!trackingNumber && order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('tracking_number, user_id')
        .eq('id', order_id)
        .single()

      if (!order) return err('Order not found', 404)

      // Verify ownership
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

      if (profile?.role !== 'admin' && order.user_id !== user!.id) {
        return err('Forbidden', 403)
      }

      trackingNumber = order.tracking_number
    }

    if (!trackingNumber) return err('No tracking number found for this order')

    const tracking = await trackShipment(trackingNumber)

    return ok(tracking.tracking_data)
  } catch (e) {
    console.error('GET /api/shipping/track', e)
    return err('Failed to fetch tracking info', 500)
  }
}
