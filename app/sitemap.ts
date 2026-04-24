import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE = 'https://urbandrip.net'

const COLLECTIONS = ['anime', 'sports', 'streetwear', 'ai', 'gaming', 'music']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,             lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const collectionPages: MetadataRoute.Sitemap = COLLECTIONS.map(c => ({
    url:             `${BASE}/collections/${c}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }))

  const productPages: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url:             `${BASE}/products/${p.slug}`,
    lastModified:    p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  return [...staticPages, ...collectionPages, ...productPages]
}
