import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ProductFiltersBar } from '@/components/product/ProductFiltersBar'
import type { Product, ProductVariant, ProductFilters } from '@/types'

export const metadata: Metadata = {
  title:       'All Products',
  description: 'Shop Urban Drip anime streetwear, gymwear and pickleball clothing.',
}

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

async function ProductList({ filters }: { filters: ProductFilters }) {
  const supabase = await createClient()

  const page  = filters.page ?? 1
  const limit = filters.limit ?? 24
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  let query = supabase
    .from('products')
    .select('*, variants:product_variants(*)', { count: 'exact' })
    .eq('is_active', true)
    .range(from, to)

  if (filters.collection) query = query.eq('collection', filters.collection)
  if (filters.category)   query = query.eq('category',   filters.category)
  if (filters.fit_type)   query = query.eq('fit_type',   filters.fit_type)
  if (filters.search)     query = query.ilike('title',  `%${filters.search}%`)

  switch (filters.sort) {
    case 'price_asc':  query = query.order('created_at', { ascending: true });  break
    case 'price_desc': query = query.order('created_at', { ascending: false }); break
    default:           query = query.order('created_at', { ascending: false })
  }

  const { data, count } = await query
  const products = (data ?? []) as (Product & { variants: ProductVariant[] })[]

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="font-heading text-2xl text-ud-white mb-3">NO PRODUCTS FOUND</p>
        <p className="text-ud-muted">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-ud-muted text-sm mb-6 font-mono">{count ?? products.length} products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: ProductFilters = {
    collection: params.collection as ProductFilters['collection'],
    fit_type:   params.fit_type   as ProductFilters['fit_type'],
    category:   params.category,
    search:     params.search,
    sort:       (params.sort as ProductFilters['sort']) ?? 'newest',
    page:       params.page ? parseInt(params.page, 10) : 1,
  }

  return (
    <div className="ud-container py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs text-ud-accent tracking-[0.3em] mb-2">CATALOGUE</p>
        <h1 className="section-title">
          {filters.collection
            ? filters.collection.toUpperCase()
            : 'ALL PRODUCTS'}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <ProductFiltersBar currentFilters={filters} />
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <ProductList filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
