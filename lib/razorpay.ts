import Razorpay from 'razorpay'
import crypto from 'crypto'
import type {
  CreateRazorpayOrderInput,
  RazorpayOrderResponse,
  RazorpayPaymentSuccess,
} from '@/types'

// ─── SDK instance (server-only) ───────────────────────────────────────────────

export const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// ─── Create order ─────────────────────────────────────────────────────────────

export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput
): Promise<RazorpayOrderResponse> {
  const order = await razorpay.orders.create({
    amount:   Math.round(input.amount * 100), // Razorpay expects paise
    currency: input.currency ?? 'INR',
    receipt:  input.receipt,
    notes:    input.notes ?? {},
  })

  return order as RazorpayOrderResponse
}

// ─── Verify payment signature (post-checkout) ─────────────────────────────────

export function verifyPaymentSignature(payment: RazorpayPaymentSuccess): boolean {
  const body = `${payment.razorpay_order_id}|${payment.razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(payment.razorpay_signature)
  )
}

// ─── Verify webhook signature ─────────────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}

// ─── Fetch payment details ────────────────────────────────────────────────────

export async function fetchPayment(paymentId: string) {
  return razorpay.payments.fetch(paymentId)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Paise → rupees */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/** Rupees → paise */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}
