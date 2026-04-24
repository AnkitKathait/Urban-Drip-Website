import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { discountFromPoints } from '@/lib/utils'

// ─── GET /api/loyalty — balance + transaction history ─────────────────────────

export async function GET(_request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const [profileResult, txResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user!.id)
        .single(),
      supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (profileResult.error) return err(profileResult.error.message)

    const points           = profileResult.data?.loyalty_points ?? 0
    const redeemableValue  = discountFromPoints(points) // ₹50 per 100 pts
    const redeemablePoints = Math.floor(points / 100) * 100 // Must redeem in multiples of 100

    return ok({
      points,
      redeemable_points: redeemablePoints,
      redeemable_value:  redeemableValue,
      transactions:      txResult.data ?? [],
      tier:              getLoyaltyTier(points),
    })
  } catch (e) {
    console.error('GET /api/loyalty', e)
    return err('Internal server error', 500)
  }
}

// ─── POST /api/loyalty — validate redemption before checkout ──────────────────

export async function POST(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { points_to_redeem, order_total } = await request.json()

    if (!points_to_redeem || points_to_redeem <= 0) return err('Invalid points amount')
    if (points_to_redeem % 100 !== 0) return err('Points must be redeemed in multiples of 100')

    const { data: profile } = await supabase
      .from('profiles')
      .select('loyalty_points')
      .eq('id', user!.id)
      .single()

    if (!profile) return err('Profile not found', 404)
    if ((profile.loyalty_points ?? 0) < points_to_redeem) return err('Insufficient loyalty points')

    const discount = discountFromPoints(points_to_redeem)

    // Discount cannot exceed order total
    if (discount > order_total) {
      return err(`Maximum redeemable discount is ₹${order_total} for this order`)
    }

    return ok({
      points_to_redeem,
      discount_amount:   discount,
      remaining_points:  (profile.loyalty_points ?? 0) - points_to_redeem,
    })
  } catch (e) {
    console.error('POST /api/loyalty', e)
    return err('Internal server error', 500)
  }
}

// ─── Loyalty tier helper ──────────────────────────────────────────────────────

function getLoyaltyTier(points: number): { name: string; color: string; next_tier: number | null } {
  if (points >= 5000) return { name: 'Legend',   color: '#D4AF37', next_tier: null }
  if (points >= 2000) return { name: 'Elite',    color: '#8B5CF6', next_tier: 5000 }
  if (points >= 500)  return { name: 'Drip',     color: '#3B82F6', next_tier: 2000 }
  return                     { name: 'Rookie',   color: '#A0A0A0', next_tier: 500  }
}
