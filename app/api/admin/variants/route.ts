import { NextRequest } from 'next/server'
import { ok, err, requireAdmin } from '@/lib/api-helpers'

// ─── PATCH /api/admin/variants — update a single variant ─────────────────────
export async function PATCH(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { variant_id, ...fields } = await request.json()
    if (!variant_id) return err('variant_id required')

    const { data, error } = await supabase
      .from('product_variants')
      .update(fields)
      .eq('id', variant_id)
      .select()
      .single()

    if (error) return err(error.message)
    return ok(data)
  } catch (e) {
    console.error('PATCH /api/admin/variants', e)
    return err('Internal server error', 500)
  }
}
