import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { createRazorpayOrder } from '@/lib/razorpay'
import { generateOrderNumber } from '@/lib/utils'

// ─── POST /api/payments/create ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { response, user } = await requireAuth()
  if (response) return response

  try {
    const { amount, notes } = await request.json()

    if (!amount || amount < 1)        return err('Invalid amount')
    if (amount > 100000)              return err('Amount exceeds maximum order value')

    const receipt = generateOrderNumber()

    const order = await createRazorpayOrder({
      amount,  // in rupees — razorpay.ts converts to paise
      currency: 'INR',
      receipt,
      notes: {
        user_id: user!.id,
        ...notes,
      },
    })

    return ok({
      order_id:  order.id,
      amount:    order.amount,
      currency:  order.currency,
      receipt:   order.receipt,
      key_id:    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    })
  } catch (e) {
    console.error('POST /api/payments/create', e)
    return err('Failed to create payment order', 500)
  }
}
