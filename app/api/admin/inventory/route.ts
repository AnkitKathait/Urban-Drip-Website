import { NextRequest } from 'next/server'
import { ok, err, requireAdmin } from '@/lib/api-helpers'

// ─── GET /api/admin/inventory ─────────────────────────────────────────────────
export async function GET() {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, slug, collection, is_active, images,
        variants:product_variants(id, sku, size, price, mrp, stock, is_active)
      `)
      .order('title', { ascending: true })

    if (error) return err(error.message)
    return ok(data ?? [])
  } catch (e) {
    console.error('GET /api/admin/inventory', e)
    return err('Internal server error', 500)
  }
}

// ─── PATCH /api/admin/inventory — bulk stock update ───────────────────────────
export async function PATCH(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const body: { updates: { variant_id: string; stock: number }[] } = await request.json()
    if (!body.updates?.length) return err('No updates provided')

    const results = await Promise.all(
      body.updates.map(({ variant_id, stock }) =>
        supabase
          .from('product_variants')
          .update({ stock })
          .eq('id', variant_id)
          .select('id, stock')
          .single()
      )
    )

    const errors = results.filter(r => r.error).map(r => r.error!.message)
    if (errors.length) return err(errors.join(', '))

    return ok({ updated: body.updates.length })
  } catch (e) {
    console.error('PATCH /api/admin/inventory', e)
    return err('Internal server error', 500)
  }
}
