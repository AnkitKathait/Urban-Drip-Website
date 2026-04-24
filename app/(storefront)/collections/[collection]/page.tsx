import { notFound }    from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductCard }  from '@/components/product/ProductCard'
import { COLLECTION_META } from '@/lib/utils'
import type { Product, ProductVariant, ProductCollection } from '@/types'

type Params = Promise<{ collection: string }>

const VALID: ProductCollection[] = ['anime', 'sports', 'streetwear', 'ai', 'gaming', 'music']

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { collection } = await params
  if (!VALID.includes(collection as ProductCollection)) return { title: 'Not found' }
  const meta = COLLECTION_META[collection as ProductCollection]
  const title       = `${meta.title} — Urban Drip`
  const description = `${meta.tagline} Shop the Urban Drip ${meta.title.toLowerCase()} — original graphic tees, oversized fits, premium 220 GSM cotton. Free shipping above ₹999.`
  const url         = `https://urbandrip.net/collections/${collection}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Urban Drip',
      type:     'website',
      locale:   'en_IN',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { collection } = await params

  if (!VALID.includes(collection as ProductCollection)) notFound()

  const meta     = COLLECTION_META[collection as ProductCollection]
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('collection', collection)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const products = (data ?? []) as (Product & { variants: ProductVariant[] })[]

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',        item: 'https://urbandrip.net' },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: 'https://urbandrip.net/products' },
      { '@type': 'ListItem', position: 3, name: meta.title,    item: `https://urbandrip.net/collections/${collection}` },
    ],
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    <div>
      {/* Hero banner */}
      <div className={`relative bg-gradient-to-br ${meta.gradient} py-24 overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(${meta.accentColor}44 1px, transparent 1px), linear-gradient(90deg, ${meta.accentColor}44 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="ud-container relative z-10">
          <p className="font-mono text-xs tracking-[0.3em] mb-3" style={{ color: meta.accentColor }}>
            URBAN DRIP
          </p>
          <h1 className="font-bebas text-6xl md:text-8xl text-ud-white leading-none mb-4">
            {meta.title.toUpperCase()}
          </h1>
          <p className="font-heading text-xl text-ud-muted tracking-wider">{meta.tagline.toUpperCase()}</p>
        </div>
      </div>

      {/* Products */}
      <div className="ud-container py-12">
        <p className="font-mono text-xs text-ud-muted mb-8">{products.length} products</p>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-heading text-2xl text-ud-white mb-3">DROPPING SOON</p>
            <p className="text-ud-muted">New {meta.title.toLowerCase()} arrivals are on the way.</p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
