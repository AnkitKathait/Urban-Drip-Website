import { NextRequest } from 'next/server'
import { ok, err, requireAdmin } from '@/lib/api-helpers'

type Params = Promise<{ id: string }>

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params

    // Delete variants first (FK constraint)
    await supabase.from('product_variants').delete().eq('product_id', id)

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return err(error.message)

    return ok({ message: 'Product permanently deleted' })
  } catch (e) {
    console.error('DELETE /api/admin/products/[id]', e)
    return err('Internal server error', 500)
  }
}
