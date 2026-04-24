import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import type { Product, ProductVariant } from '@/types'

type PW = Product & { variants: ProductVariant[] }

async function query(opts: {
  collection?: string
  fit_type?: string
  limit?: number
}): Promise<PW[]> {
  const supabase = await createClient()
  let q = supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 4)
  if (opts.collection) q = q.eq('collection', opts.collection)
  if (opts.fit_type)   q = q.eq('fit_type', opts.fit_type)
  const { data } = await q
  return (data ?? []) as PW[]
}

const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type':  'WebSite',
      '@id':    'https://urbandrip.net/#website',
      url:      'https://urbandrip.net',
      name:     'Urban Drip',
      description: 'India\'s premium streetwear brand',
      potentialAction: {
        '@type':       'SearchAction',
        target:        'https://urbandrip.net/products?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type':  'Organization',
      '@id':    'https://urbandrip.net/#organization',
      name:     'Urban Drip',
      url:      'https://urbandrip.net',
      logo: {
        '@type': 'ImageObject',
        url:     'https://urbandrip.net/logo.png',
      },
      sameAs: [
        'https://www.instagram.com/urbandrip.in',
      ],
    },
  ],
}

export default async function HomePage() {
  const [aiProducts, newArrivals, oversized, regularFit] = await Promise.all([
    query({ collection: 'ai',       limit: 4 }),
    query({                          limit: 8 }),
    query({ fit_type: 'oversized',  limit: 4 }),
    query({ fit_type: 'regular',    limit: 4 }),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
      />
      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col justify-center bg-[#080808] overflow-hidden -mt-[99px] pt-[99px]">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.5,
          }}
        />

        {/* Bottom red gradient bleed */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(255,35,35,0.07) 0%, transparent 100%)' }} />

        {/* Left vertical accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ud-accent hidden lg:block" />

        {/* Diagonal decorative lines */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] overflow-hidden hidden xl:block pointer-events-none">
          {[0,1,2,3,4].map(i => (
            <div
              key={i}
              className="absolute border-l border-[#181818]"
              style={{ right: `${i * 80}px`, top: 0, bottom: 0, transform: 'skewX(-12deg)' }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="ud-container relative z-10 w-full flex-1 flex flex-col justify-center py-20 lg:py-28">

          {/* Overline */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-[2px] bg-ud-accent" />
            <span className="font-heading text-[10px] tracking-[0.4em] text-ud-accent">SS2026 / NEW COLLECTION</span>
            <div className="w-10 h-[2px] bg-ud-accent" />
          </div>

          {/* Giant headline */}
          <div className="font-display leading-[0.88] mb-8 select-none">
            <div
              className="block text-[clamp(5rem,16vw,13rem)] text-ud-white"
              style={{ letterSpacing: '-0.02em' }}
            >
              WEAR
            </div>
            <div
              className="block text-[clamp(5rem,16vw,13rem)]"
              style={{
                letterSpacing: '-0.02em',
                WebkitTextStroke: '2px rgba(255,255,255,0.15)',
                color: 'transparent',
              }}
            >
              THE
            </div>
            <div
              className="block text-[clamp(5rem,16vw,13rem)] text-ud-accent"
              style={{ letterSpacing: '-0.02em' }}
            >
              LEGEND.
            </div>
          </div>

          {/* Sub-row: description + CTA */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 lg:gap-16">
            <div className="max-w-sm">
              <p className="text-[#666] text-sm md:text-base leading-relaxed font-sans">
                India&apos;s premium streetwear — anime, sports, gaming, AI-themed drops.
                Built for the culture. Made to last.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/products"
                className="btn-primary text-sm px-8 py-4 inline-flex items-center gap-3 tracking-[0.15em]"
              >
                SHOP ALL DROPS <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/collections/ai"
                className="btn-secondary text-sm px-8 py-4 inline-flex items-center gap-3 tracking-[0.15em]"
              >
                AI COLLECTION
              </Link>
            </div>
          </div>
        </div>

        {/* Collection strip at bottom of hero */}
        <div className="relative z-10 border-t border-[#181818] mt-auto">
          <div className="ud-container">
            <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-[#181818]">
              {[
                { slug: 'anime',      label: 'Anime',      accent: '#8B5CF6' },
                { slug: 'sports',     label: 'Sports',     accent: '#3B82F6' },
                { slug: 'streetwear', label: 'Streetwear', accent: '#F97316' },
                { slug: 'ai',         label: 'AI',         accent: '#06B6D4' },
                { slug: 'gaming',     label: 'Gaming',     accent: '#00E87A' },
                { slug: 'music',      label: 'Music',      accent: '#EC4899' },
              ].map(c => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="group flex flex-col items-center gap-2 py-5 hover:bg-[#0F0F0F] transition-colors"
                >
                  <div className="w-5 h-[2px] transition-all duration-300 group-hover:w-8" style={{ background: c.accent }} />
                  <span className="font-heading text-[10px] tracking-[0.2em] text-[#444] group-hover:text-ud-white transition-colors">
                    {c.label.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ──────────────────────────────────────────────────────────── */}
      <div className="border-y border-[#1E1E1E] bg-[#0A0A0A] overflow-hidden py-3.5">
        <div className="flex whitespace-nowrap">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="flex items-center">
                {[
                  'AI T-SHIRTS',
                  'ANIME STREETWEAR',
                  'GAMING DROPS',
                  'SPORTS COLLECTION',
                  'FREE SHIPPING ₹999+',
                  'ORIGINAL ARTWORK',
                  'PREMIUM 220 GSM',
                  'PAN-INDIA DELIVERY',
                  'EASY RETURNS',
                ].map((text, j) => (
                  <span key={j} className="flex items-center gap-8 mr-8">
                    <span className="font-heading text-[11px] tracking-[0.25em] text-[#444]">{text}</span>
                    <span className="text-ud-accent text-[8px]">◆</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CATEGORY GRID ────────────────────────────────────────────────────── */}
      <section className="ud-container py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="overline-accent mb-3">Collections</p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-ud-white">SHOP BY CATEGORY</h2>
          </div>
          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 font-heading text-[11px] tracking-[0.2em] text-[#555] hover:text-ud-white transition-colors"
          >
            ALL COLLECTIONS <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1A1A1A]">
          {[
            { slug: 'ai',         label: 'AI T-Shirts',  tag: 'NEW',     accent: '#06B6D4', num: '01' },
            { slug: 'sports',     label: 'Sports',        tag: 'ACTIVE',  accent: '#3B82F6', num: '02' },
            { slug: 'gaming',     label: 'Gaming',        tag: 'HOT',     accent: '#00E87A', num: '03' },
            { slug: 'streetwear', label: 'Streetwear',    tag: 'CLASSIC', accent: '#F97316', num: '04' },
            { slug: 'anime',      label: 'Anime',         tag: 'FANDOM',  accent: '#8B5CF6', num: '05' },
            { slug: 'music',      label: 'Music',         tag: 'VIBES',   accent: '#EC4899', num: '06' },
          ].map(c => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group relative bg-[#0C0C0C] overflow-hidden min-h-[200px] md:min-h-[260px] flex flex-col justify-between p-6 md:p-8 hover:bg-[#101010] transition-colors"
            >
              {/* Gradient accent */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(ellipse at bottom left, ${c.accent}18 0%, transparent 70%)` }}
              />

              {/* Number + tag */}
              <div className="relative flex items-start justify-between">
                <span className="font-display text-[3rem] leading-none text-[#1A1A1A] group-hover:text-[#222] transition-colors select-none">
                  {c.num}
                </span>
                <span
                  className="font-heading text-[9px] tracking-[0.2em] px-2 py-0.5"
                  style={{ color: c.accent, background: `${c.accent}18` }}
                >
                  {c.tag}
                </span>
              </div>

              {/* Content */}
              <div className="relative">
                <div className="w-6 h-[2px] mb-4 transition-all duration-300 group-hover:w-12" style={{ background: c.accent }} />
                <h3 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] text-ud-white leading-none mb-3">
                  {c.label.toUpperCase()}
                </h3>
                <span
                  className="inline-flex items-center gap-2 font-heading text-[10px] tracking-[0.2em] group-hover:gap-3 transition-all"
                  style={{ color: c.accent }}
                >
                  SHOP NOW <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── AI T-SHIRTS FEATURED ─────────────────────────────────────────────── */}
      {aiProducts.length > 0 && (
        <section className="bg-[#0A0A0A] border-t border-[#1E1E1E]">
          <div className="ud-container py-16 md:py-24">
            <div className="flex items-end justify-between mb-3">
              <p className="overline-accent" style={{ color: '#06B6D4' }}>AI Collection</p>
              <Link href="/collections/ai" className="hidden md:flex items-center gap-1.5 font-heading text-[11px] tracking-[0.2em] text-[#555] hover:text-ud-white transition-colors">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex items-end justify-between mb-10 border-b border-[#1E1E1E] pb-6">
              <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-ud-white">AI T-SHIRTS</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1A1A1A]">
              {aiProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/collections/ai" className="btn-secondary inline-flex items-center gap-2 text-sm tracking-[0.15em]">
                VIEW ALL AI DROPS <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── NEW ARRIVALS ─────────────────────────────────────────────────────── */}
      <section className="border-t border-[#1E1E1E]">
        <div className="ud-container py-16 md:py-24">
          <div className="flex items-end justify-between mb-3">
            <p className="overline-accent">Fresh Drops</p>
            <Link href="/products" className="hidden md:flex items-center gap-1.5 font-heading text-[11px] tracking-[0.2em] text-[#555] hover:text-ud-white transition-colors">
              ALL PRODUCTS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-end justify-between mb-10 border-b border-[#1E1E1E] pb-6">
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-ud-white">NEW ARRIVALS</h2>
          </div>

          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1A1A1A]">
              {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-24 border border-[#1E1E1E]">
              <p className="font-heading text-[#444] tracking-wider">DROPS COMING SOON</p>
              <p className="text-[#333] text-sm mt-2 font-sans">Check back shortly for new arrivals.</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/products" className="btn-secondary inline-flex items-center gap-2 text-sm tracking-[0.15em]">
              VIEW ALL DROPS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── OVERSIZED T-SHIRTS ───────────────────────────────────────────────── */}
      {oversized.length > 0 && (
        <section className="bg-[#0A0A0A] border-t border-[#1E1E1E]">
          <div className="ud-container py-16 md:py-24">
            <div className="flex items-end justify-between mb-3">
              <p className="overline-accent">Heavy Fits</p>
              <Link href="/products?fit_type=oversized" className="hidden md:flex items-center gap-1.5 font-heading text-[11px] tracking-[0.2em] text-[#555] hover:text-ud-white transition-colors">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex items-end justify-between mb-10 border-b border-[#1E1E1E] pb-6">
              <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-ud-white">OVERSIZED T-SHIRTS</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1A1A1A]">
              {oversized.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── REGULAR FIT ──────────────────────────────────────────────────────── */}
      {regularFit.length > 0 && (
        <section className="border-t border-[#1E1E1E]">
          <div className="ud-container py-16 md:py-24">
            <div className="flex items-end justify-between mb-3">
              <p className="overline-accent">Classic Fit</p>
              <Link href="/products?fit_type=regular" className="hidden md:flex items-center gap-1.5 font-heading text-[11px] tracking-[0.2em] text-[#555] hover:text-ud-white transition-colors">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex items-end justify-between mb-10 border-b border-[#1E1E1E] pb-6">
              <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-ud-white">REGULAR FIT</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1A1A1A]">
              {regularFit.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── STATS STRIP ──────────────────────────────────────────────────────── */}
      <section className="bg-[#0A0A0A] border-t border-[#1E1E1E]">
        <div className="ud-container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1E1E1E]">
            {[
              { value: '10K+', label: 'Happy customers' },
              { value: '50+',  label: 'Original designs' },
              { value: '4.8',  label: 'Avg. rating'     },
              { value: '24hr', label: 'Ships out in'    },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 py-10 md:py-14 flex flex-col gap-1">
                <div className="font-display text-[clamp(2.5rem,5vw,4rem)] text-ud-white leading-none">{value}</div>
                <div className="font-heading text-[10px] tracking-[0.2em] text-[#555] mt-1">{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST BADGES ─────────────────────────────────────────────────────── */}
      <section className="border-t border-b border-[#1E1E1E]">
        <div className="ud-container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: '🚚', title: 'Free Shipping', sub: 'On orders above ₹999' },
              { icon: '↩', title: 'Easy Returns',   sub: '7-day hassle-free returns' },
              { icon: '🛡', title: '100% Original',  sub: 'In-house designed artwork' },
              { icon: '⚡', title: 'Fast Dispatch',  sub: 'Shipped within 24 hours' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="text-2xl">{icon}</div>
                <div className="font-heading text-[11px] tracking-[0.15em] text-ud-white">{title.toUpperCase()}</div>
                <div className="font-sans text-[12px] text-[#555]">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRAND MANIFESTO ──────────────────────────────────────────────────── */}
      <section className="bg-[#080808]">
        <div className="ud-container py-24 md:py-32">
          <div className="max-w-4xl">
            <p className="overline-accent mb-8">The Standard</p>
            <h2
              className="font-display text-[clamp(3rem,8vw,7rem)] leading-none mb-2"
              style={{ color: 'transparent', WebkitTextStroke: '1px rgba(240,240,240,0.12)' }}
            >
              WE DON&apos;T DO BASICS.
            </h2>
            <div
              className="font-display text-[clamp(3rem,8vw,7rem)] leading-none text-ud-white -mt-[0.85em] mb-12"
              aria-hidden="true"
            >
              WE DON&apos;T DO BASICS.
            </div>

            <p className="text-[#666] text-base md:text-lg leading-relaxed max-w-xl mb-12 font-sans">
              Every design is original. Every fabric is GSM-tested. Every print is built to outlast 100+ washes.
              We make clothing for people who actually give a damn about what they wear.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-[#1E1E1E] pt-10">
              {[
                { number: '100%', label: 'Original artwork',    sub: 'Not bootleg. Designed in-house.' },
                { number: '220g', label: 'GSM fabric minimum',  sub: 'Heavyweight. Premium cotton.'    },
                { number: '24hr', label: 'Dispatch guarantee',  sub: 'Tracked. Pan-India.'             },
              ].map(({ number, label, sub }) => (
                <div key={label}>
                  <div className="font-display text-4xl text-ud-accent mb-1">{number}</div>
                  <div className="font-heading text-sm text-ud-white tracking-wider mb-1">{label.toUpperCase()}</div>
                  <div className="text-[#555] text-xs font-sans">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="ud-container py-16 md:py-24">
        <div className="relative overflow-hidden bg-[#0D0D0D] border border-[#1E1E1E] p-10 md:p-16">
          <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-ud-accent opacity-40" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-ud-accent opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,45,45,0.06)_0%,transparent_60%)]" />

          <div className="relative z-10 max-w-2xl">
            <p className="overline-accent mb-4">Limited offer</p>
            <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] text-ud-white leading-none mb-6">
              FIRST ORDER<br />
              <span className="text-ud-accent">BONUS.</span>
            </h2>
            <p className="text-[#666] text-base mb-8 font-sans leading-relaxed">
              Place your first order and earn 50 loyalty points — worth ₹25 off your next drop.
              Plus 1 point for every ₹10 you spend, forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/products" className="btn-primary inline-flex items-center gap-3 text-sm px-8 py-4 tracking-[0.15em]">
                START SHOPPING <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections/ai" className="btn-secondary inline-flex items-center gap-3 text-sm px-8 py-4 tracking-[0.15em]">
                AI COLLECTION
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
