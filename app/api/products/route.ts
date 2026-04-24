import { NextRequest } from 'next/server'
import { ok, err, requireAdmin, parsePagination } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import type { ProductFilters } from '@/types'

// ─── GET /api/products ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase     = await createClient()
    const { searchParams } = request.nextUrl
    const { from, to, page, limit } = parsePagination(searchParams)

    const filters: ProductFilters = {
      collection: searchParams.get('collection') as ProductFilters['collection'] ?? undefined,
      category:   searchParams.get('category')   ?? undefined,
      fit_type:   searchParams.get('fit_type')   as ProductFilters['fit_type'] ?? undefined,
      search:     searchParams.get('search')      ?? undefined,
      sort:       searchParams.get('sort')        as ProductFilters['sort'] ?? 'newest',
      size:       searchParams.get('size')        as ProductFilters['size'] ?? undefined,
      min_price:  searchParams.get('min_price')  ? Number(searchParams.get('min_price'))  : undefined,
      max_price:  searchParams.get('max_price')  ? Number(searchParams.get('max_price'))  : undefined,
    }

    let query = supabase
      .from('products')
      .select(
        `
        *,
        variants:product_variants(id, size, price, mrp, stock, is_active)
        `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .range(from, to)

    if (filters.collection) query = query.eq('collection', filters.collection)
    if (filters.category)   query = query.eq('category', filters.category)
    if (filters.fit_type)   query = query.eq('fit_type', filters.fit_type)

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    if (filters.size) {
      query = query.contains('variants', [{ size: filters.size, is_active: true }])
    }

    switch (filters.sort) {
      case 'price_asc':
        query = query.order('created_at', { ascending: true })
        break
      case 'price_desc':
        query = query.order('created_at', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) return err(error.message)

    return ok({
      data:    data ?? [],
      total:   count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > to + 1,
    })
  } catch (e) {
    console.error('GET /api/products', e)
    return err('Internal server error', 500)
  }
}

// ─── POST /api/products (admin only) ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { response, supabase } = await requireAdmin()
  if (response) return response

  try {
    const body = await request.json()

    // Auto-generate slug if not provided
    if (!body.slug && body.title) {
      body.slug = slugify(body.title)
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        slug:              body.slug,
        title:             body.title,
        description:       body.description ?? null,
        collection:        body.collection,
        category:          body.category,
        fit_type:          body.fit_type ?? 'regular',
        material:          body.material ?? 'Cotton',
        pattern:           body.pattern ?? 'Graphic Print',
        neck_style:        body.neck_style ?? 'Round Neck',
        sleeve_type:       body.sleeve_type ?? 'Half Sleeve',
        subject_character: body.subject_character ?? null,
        color:             body.color ?? 'Black',
        color_map:         body.color_map ?? 'Black',
        images:            body.images ?? [],
        bullet_points:     body.bullet_points ?? [],
        backend_keywords:  body.backend_keywords ?? null,
        hsn_code:          body.hsn_code ?? '61051010',
        is_active:         body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return err('A product with this slug already exists', 409)
      return err(error.message)
    }

    // Use admin-specified sizes/price/stock if provided, else fall back to defaults
    const fitType = body.fit_type ?? 'regular'
    const sizes   = body._variant_sizes?.length
      ? body._variant_sizes
      : fitType === 'oversized' ? ['S', 'M', 'L', 'XL', '2XL'] : ['XS', 'S', 'M', 'L', 'XL', '2XL']
    const price   = body._variant_price ?? (fitType === 'oversized' ? 599 : 499)
    const mrp     = body._variant_mrp   ?? (fitType === 'oversized' ? 1299 : 999)
    const stock   = body._variant_stock ?? 100

    const variants = sizes.map((size: string) => ({
      product_id: product.id,
      sku:        `${body.slug?.toUpperCase()}-${size}`,
      size,
      price,
      mrp,
      stock,
      is_active:  true,
    }))

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variants)

    if (variantError) {
      console.error('Failed to create default variants:', variantError.message)
    }

    return ok(product, 201)
  } catch (e) {
    console.error('POST /api/products', e)
    return err('Internal server error', 500)
  }
}
