import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api-helpers'

// ─── GET /api/cart ────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        variant:product_variants(
          *,
          product:products(id, slug, title, images, collection, is_active)
        )
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })

    if (error) return err(error.message)

    // Filter out items whose product was deactivated
    const activeItems = (data ?? []).filter(
      item => item.variant?.product?.is_active === true && item.variant?.is_active === true
    )

    return ok(activeItems)
  } catch (e) {
    console.error('GET /api/cart', e)
    return err('Internal server error', 500)
  }
}

// ─── POST /api/cart — add or increment item ───────────────────────────────────

export async function POST(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { variant_id, quantity = 1 } = await request.json()

    if (!variant_id)         return err('variant_id is required')
    if (quantity < 1)        return err('Quantity must be at least 1')
    if (quantity > 10)       return err('Maximum 10 units per item')

    // Verify variant exists + has stock
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('id, stock, is_active')
      .eq('id', variant_id)
      .single()

    if (variantError || !variant) return err('Variant not found', 404)
    if (!variant.is_active)                   return err('This size is no longer available', 409)
    if ((variant.stock ?? 0) < quantity)      return err('Insufficient stock', 409)

    // Upsert — increment if already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user!.id)
      .eq('variant_id', variant_id)
      .single()

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, 10)
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return err(error.message)
      return ok(data)
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: user!.id, variant_id, quantity })
      .select()
      .single()

    if (error) return err(error.message)
    return ok(data, 201)
  } catch (e) {
    console.error('POST /api/cart', e)
    return err('Internal server error', 500)
  }
}

// ─── PUT /api/cart — update quantity ─────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { cart_item_id, quantity } = await request.json()

    if (!cart_item_id)   return err('cart_item_id is required')
    if (quantity < 1)    return err('Quantity must be at least 1')
    if (quantity > 10)   return err('Maximum 10 units per item')

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cart_item_id)
      .eq('user_id', user!.id) // Ownership check
      .select()
      .single()

    if (error) return err(error.message)
    if (!data)  return err('Cart item not found', 404)

    return ok(data)
  } catch (e) {
    console.error('PUT /api/cart', e)
    return err('Internal server error', 500)
  }
}

// ─── DELETE /api/cart — remove item ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const { response, user, supabase } = await requireAuth()
  if (response) return response

  try {
    const { cart_item_id, clear_all } = await request.json()

    if (clear_all) {
      await supabase.from('cart_items').delete().eq('user_id', user!.id)
      return ok({ message: 'Cart cleared' })
    }

    if (!cart_item_id) return err('cart_item_id is required')

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cart_item_id)
      .eq('user_id', user!.id) // Ownership check

    if (error) return err(error.message)

    return ok({ message: 'Item removed' })
  } catch (e) {
    console.error('DELETE /api/cart', e)
    return err('Internal server error', 500)
  }
}
