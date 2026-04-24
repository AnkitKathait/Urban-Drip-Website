import type { ShiprocketCreateOrderInput, ShiprocketTrackingResponse } from '@/types'

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

// ─── Token management (cached per process) ────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      email:    process.env.SHIPROCKET_EMAIL!,
      password: process.env.SHIPROCKET_PASSWORD!,
    }),
  })

  if (!res.ok) throw new Error('Shiprocket auth failed')

  const json = await res.json()
  cachedToken  = json.token as string
  // Token is valid for 10 days — cache for 9 days to be safe
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000
  return cachedToken
}

async function shiprocketFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Shiprocket request failed')
  return json as T
}

// ─── Create order ─────────────────────────────────────────────────────────────

export async function createShiprocketOrder(input: ShiprocketCreateOrderInput) {
  return shiprocketFetch<{
    order_id:    number
    shipment_id: number
    status:      string
  }>('/orders/create/adhoc', {
    method: 'POST',
    body:   JSON.stringify(input),
  })
}

// ─── Generate AWB + assign courier ───────────────────────────────────────────

export async function assignAWB(shipmentId: number) {
  return shiprocketFetch<{
    awb_code:  string
    courier_id: number
  }>('/courier/assign/awb', {
    method: 'POST',
    body:   JSON.stringify({ shipment_id: shipmentId }),
  })
}

// ─── Get shipping rates ───────────────────────────────────────────────────────

export interface ShiprocketRatesInput {
  pickup_postcode:   string
  delivery_postcode: string
  weight:            number // kg
  cod:               boolean
}

export async function getShippingRates(input: ShiprocketRatesInput) {
  const params = new URLSearchParams({
    pickup_postcode:   input.pickup_postcode,
    delivery_postcode: input.delivery_postcode,
    weight:            String(input.weight),
    cod:               input.cod ? '1' : '0',
  })

  return shiprocketFetch<{ data: { available_courier_companies: unknown[] } }>(
    `/courier/serviceability/?${params.toString()}`
  )
}

// ─── Track shipment ───────────────────────────────────────────────────────────

export async function trackShipment(awb: string): Promise<ShiprocketTrackingResponse> {
  return shiprocketFetch<ShiprocketTrackingResponse>(`/courier/track/awb/${awb}`)
}

// ─── Cancel order ─────────────────────────────────────────────────────────────

export async function cancelShiprocketOrder(orderId: number) {
  return shiprocketFetch('/orders/cancel', {
    method: 'POST',
    body:   JSON.stringify({ ids: [orderId] }),
  })
}

// ─── Pickup location (defaults to your warehouse) ────────────────────────────

export const PICKUP_LOCATION = 'Primary' // Set this in Shiprocket dashboard
export const WAREHOUSE_PINCODE = '110001' // Update with your actual pincode
