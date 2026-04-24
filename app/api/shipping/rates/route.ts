import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { getShippingRates, WAREHOUSE_PINCODE } from '@/lib/shiprocket'

// ─── POST /api/shipping/rates ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { response } = await requireAuth()
  if (response) return response

  try {
    const { delivery_pincode, weight = 0.5, cod = false } = await request.json()

    if (!delivery_pincode) return err('delivery_pincode is required')
    if (!/^[1-9][0-9]{5}$/.test(delivery_pincode)) return err('Invalid pincode')

    const result = await getShippingRates({
      pickup_postcode:   WAREHOUSE_PINCODE,
      delivery_postcode: delivery_pincode,
      weight,
      cod,
    })

    const couriers = result?.data?.available_courier_companies ?? []

    // Return cheapest courier for free shipping display
    const cheapest = (couriers as Array<{
      courier_name: string
      rate:         number
      estimated_delivery_days: number
    }>)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5)

    return ok({
      couriers:         cheapest,
      free_shipping:    false, // Update with your free shipping threshold logic
      delivery_pincode,
    })
  } catch (e) {
    console.error('POST /api/shipping/rates', e)
    // Return free shipping as fallback if Shiprocket is down
    return ok({ couriers: [], free_shipping: true, delivery_pincode: '' })
  }
}
