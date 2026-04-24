import { notFound }  from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/components/product/ProductDetail'
import { ProductCard }   from '@/components/product/ProductCard'
import type { Product, ProductVariant, Review } from '@/types'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()
  const { data }  = await supabase
    .from('products')
    .select('title, description, seo_title, seo_description, seo_keywords, images')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Product not found' }

  const title       = data.seo_title       ?? data.title
  const description = data.seo_description ?? data.description ?? undefined
  const keywords    = data.seo_keywords    ?? undefined
  const image       = data.images?.[0]

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `https://urbandrip.net/products/${slug}` },
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const typedProduct = product as Product & { variants: ProductVariant[] }

  // Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)

  // Related products (same collection, different slug)
  const { data: related } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('collection', product.collection)
    .eq('is_active', true)
    .neq('slug', slug)
    .limit(4)

  const avgRating = reviews?.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const minPrice = typedProduct.variants?.reduce((min, v) =>
    v.is_active ? Math.min(min, v.price) : min, Infinity) ?? 0
  const inStock = typedProduct.variants?.some(v => v.is_active && (v.stock ?? 0) > 0)

  const jsonLd = {
    '@context':   'https://schema.org',
    '@type':      'Product',
    name:         typedProduct.title,
    description:  typedProduct.description ?? undefined,
    image:        typedProduct.images ?? [],
    sku:          typedProduct.slug,
    brand:        { '@type': 'Brand', name: 'Urban Drip' },
    offers: {
      '@type':       'Offer',
      url:           `https://urbandrip.net/products/${typedProduct.slug}`,
      priceCurrency: 'INR',
      price:         minPrice > 0 ? minPrice : undefined,
      availability:  inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Urban Drip' },
    },
    ...(avgRating > 0 && reviews?.length ? {
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:   avgRating.toFixed(1),
        reviewCount:   reviews.length,
        bestRating:    '5',
        worstRating:   '1',
      },
    } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="ud-container py-8">
      <ProductDetail
        product={{ ...typedProduct, avg_rating: avgRating, review_count: reviews?.length ?? 0 }}
        reviews={(reviews ?? []) as Review[]}
      />

      {/* Related */}
      {(related ?? []).length > 0 && (
        <section className="mt-20">
          <div className="mb-8">
            <p className="font-mono text-xs text-ud-accent tracking-[0.3em] mb-2">YOU MAY ALSO LIKE</p>
            <h2 className="font-bebas text-3xl text-ud-white">RELATED PRODUCTS</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(related as (Product & { variants: ProductVariant[] })[]).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  )
}
