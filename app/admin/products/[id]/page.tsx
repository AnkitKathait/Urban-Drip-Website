'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Upload, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product, ProductVariant } from '@/types'

type Params = Promise<{ id: string }>

const COLLECTIONS  = ['anime', 'sports', 'streetwear', 'ai', 'gaming', 'music'] as const
const FIT_TYPES    = ['regular', 'oversized'] as const
const REGULAR_SIZES   = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const OVERSIZED_SIZES = ['S', 'M', 'L', 'XL', '2XL']

function defaultVariantConfig(fitType: string) {
  return fitType === 'oversized'
    ? { sizes: OVERSIZED_SIZES, price: 599, mrp: 1299, stock: 100 }
    : { sizes: REGULAR_SIZES,   price: 499, mrp: 999,  stock: 100 }
}

export default function ProductEditPage({ params }: { params: Params }) {
  const { id }  = use(params)
  const router  = useRouter()
  const isNew   = id === 'new'

  const [product, setProduct] = useState<Partial<Product>>({
    title: '', slug: '', description: '', collection: 'anime', category: 'T-Shirts',
    fit_type: 'regular', material: 'Cotton', pattern: 'Graphic Print', neck_style: 'Round Neck',
    sleeve_type: 'Half Sleeve', color: 'Black', color_map: 'Black',
    images: [], bullet_points: [], hsn_code: '61051010', is_active: true,
  })

  // For existing products — variants fetched from DB
  const [variants, setVariants] = useState<ProductVariant[]>([])

  // For new products — configure before first save
  const [newVC, setNewVC] = useState(defaultVariantConfig('regular'))

  const [loading,     setLoading]     = useState(!isNew)
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [bulletInput, setBulletInput] = useState('')

  useEffect(() => {
    if (isNew) return
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(r => {
        if (r.data) {
          const { variants: v, ...rest } = r.data
          setProduct(rest)
          setVariants(v ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  // When fit_type changes on new products, reset size/price defaults
  function handleFitTypeChange(ft: string) {
    setProduct(p => ({ ...p, fit_type: ft as Product['fit_type'] }))
    if (isNew) setNewVC(defaultVariantConfig(ft))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (j.data?.secure_url) {
        setProduct(p => ({ ...p, images: [...(p.images ?? []), j.data.secure_url] }))
      } else {
        setError('Upload failed — check Cloudinary credentials in .env.local')
      }
    } catch {
      setError('Image upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(url: string) {
    setProduct(p => ({ ...p, images: (p.images ?? []).filter(i => i !== url) }))
  }

  function addBullet() {
    const trimmed = bulletInput.trim()
    if (!trimmed) return
    setProduct(p => ({ ...p, bullet_points: [...(p.bullet_points ?? []), trimmed] }))
    setBulletInput('')
  }

  function removeBullet(i: number) {
    setProduct(p => ({ ...p, bullet_points: (p.bullet_points ?? []).filter((_, j) => j !== i) }))
  }

  function toggleNewSize(size: string) {
    setNewVC(c => ({
      ...c,
      sizes: c.sizes.includes(size) ? c.sizes.filter(s => s !== size) : [...c.sizes, size],
    }))
  }

  function updateVariant(variantId: string, field: string, value: string | number | boolean) {
    setVariants(vs => vs.map(v => v.id === variantId ? { ...v, [field]: value } : v))
  }

  async function saveVariant(variant: ProductVariant) {
    await fetch('/api/admin/variants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variant_id: variant.id,
        price: variant.price, mrp: variant.mrp,
        stock: variant.stock, is_active: variant.is_active,
      }),
    })
  }

  async function handleSave() {
    if (!product.title?.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const url    = isNew ? '/api/products' : `/api/products/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const body = isNew
        ? { ...product, _variant_price: newVC.price, _variant_mrp: newVC.mrp, _variant_stock: newVC.stock, _variant_sizes: newVC.sizes }
        : product

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error ?? 'Save failed'); return }

      if (!isNew) {
        await Promise.all(variants.map(saveVariant))
      }

      setSuccess('Saved successfully!')
      if (isNew && j.data?.id) {
        router.push(`/admin/products/${j.data.id}`)
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(hard = false) {
    const msg = hard
      ? 'PERMANENTLY delete this product and all its variants? This cannot be undone.'
      : 'Deactivate this product? It will be hidden from the store but not deleted.'
    if (!confirm(msg)) return
    if (hard) {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
    }
    router.push('/admin/products')
  }

  if (loading) return (
    <div className="p-8 animate-pulse space-y-4">
      <div className="h-8 w-48 bg-[#1A1A1A]" />
      <div className="h-48 bg-[#111] border border-[#1E1E1E]" />
    </div>
  )

  const allSizes = product.fit_type === 'oversized' ? OVERSIZED_SIZES : REGULAR_SIZES

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')} className="text-[#444] hover:text-ud-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-ud-white">{isNew ? 'NEW PRODUCT' : 'EDIT PRODUCT'}</h1>
            {!isNew && <p className="font-heading text-[11px] tracking-[0.2em] text-[#444] mt-1">{product.slug}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <>
              <button onClick={() => handleDelete(false)}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#333] text-[#666] font-heading text-xs tracking-[0.12em] hover:border-[#555] hover:text-[#888] transition-all">
                DEACTIVATE
              </button>
              <button onClick={() => handleDelete(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-ud-accent text-ud-accent font-heading text-xs tracking-[0.12em] hover:bg-ud-accent hover:text-white transition-all">
                <Trash2 className="w-3.5 h-3.5" /> DELETE
              </button>
            </>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-ud-accent text-white font-heading text-xs tracking-[0.15em] hover:bg-[#e01e1e] disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>

      {error   && <div className="mb-6 px-4 py-3 bg-ud-accent/10 border border-ud-accent text-ud-accent text-sm font-sans">{error}</div>}
      {success && <div className="mb-6 px-4 py-3 bg-ud-neon/10 border border-ud-neon text-ud-neon text-sm font-sans">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <Section title="BASIC INFO">
            <div className="grid grid-cols-2 gap-4">
              <Field label="TITLE" span={2}>
                <input className="admin-input" value={product.title ?? ''} onChange={e => setProduct(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Gojo Satoru Oversized Tee" />
              </Field>
              <Field label="SLUG">
                <input className="admin-input" value={product.slug ?? ''} onChange={e => setProduct(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated if blank" />
              </Field>
              <Field label="CATEGORY">
                <input className="admin-input" value={product.category ?? ''} onChange={e => setProduct(p => ({ ...p, category: e.target.value }))} placeholder="e.g. T-Shirts" />
              </Field>
              <Field label="COLLECTION">
                <select className="admin-input" value={product.collection ?? 'anime'} onChange={e => setProduct(p => ({ ...p, collection: e.target.value as Product['collection'] }))}>
                  {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="FIT TYPE">
                <select className="admin-input" value={product.fit_type ?? 'regular'} onChange={e => handleFitTypeChange(e.target.value)}>
                  {FIT_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
            </div>
            <Field label="DESCRIPTION">
              <textarea className="admin-input h-24 resize-none" value={product.description ?? ''} onChange={e => setProduct(p => ({ ...p, description: e.target.value }))} placeholder="Product description shown on product page..." />
            </Field>
          </Section>

          {/* Details */}
          <Section title="DETAILS">
            <div className="grid grid-cols-2 gap-4">
              {([
                ['material',          'MATERIAL',   'e.g. 100% Cotton'],
                ['pattern',           'PATTERN',    'e.g. Graphic Print'],
                ['neck_style',        'NECK STYLE', 'e.g. Round Neck'],
                ['sleeve_type',       'SLEEVE',     'e.g. Half Sleeve'],
                ['color',             'COLOR',      'e.g. Black'],
                ['color_map',         'COLOR MAP',  'e.g. Black'],
                ['subject_character', 'CHARACTER',  'e.g. Gojo Satoru'],
                ['hsn_code',          'HSN CODE',   '61051010'],
              ] as [keyof Product, string, string][]).map(([key, label, ph]) => (
                <Field key={key} label={label}>
                  <input className="admin-input" value={(product[key] as string) ?? ''} placeholder={ph}
                    onChange={e => setProduct(p => ({ ...p, [key]: e.target.value }))} />
                </Field>
              ))}
            </div>
            <Field label="BACKEND KEYWORDS">
              <input className="admin-input" value={product.backend_keywords ?? ''} placeholder="Comma-separated SEO keywords"
                onChange={e => setProduct(p => ({ ...p, backend_keywords: e.target.value }))} />
            </Field>
          </Section>

          {/* Bullet points */}
          <Section title="PRODUCT HIGHLIGHTS">
            <ul className="space-y-2 mb-3">
              {(product.bullet_points ?? []).map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#444] font-heading text-[10px] w-4 text-right">{i + 1}.</span>
                  <span className="flex-1 text-sm text-[#C0C0C0] font-sans">{b}</span>
                  <button onClick={() => removeBullet(i)} className="text-[#444] hover:text-ud-accent transition-colors"><X className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input className="admin-input flex-1" placeholder="e.g. 100% premium cotton, 240 GSM" value={bulletInput}
                onChange={e => setBulletInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBullet()} />
              <button onClick={addBullet} className="px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-[#555] hover:text-ud-white transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO">
            <div className="space-y-4">
              <Field label="META TITLE">
                <input className="admin-input" value={product.seo_title ?? ''} placeholder={product.title || 'Defaults to product title'}
                  onChange={e => setProduct(p => ({ ...p, seo_title: e.target.value || null }))} />
                <p className="font-heading text-[9px] text-[#333] tracking-wider mt-1">{(product.seo_title ?? '').length}/60 chars recommended</p>
              </Field>
              <Field label="META DESCRIPTION">
                <textarea className="admin-input h-20 resize-none" value={product.seo_description ?? ''} placeholder="Shown in Google search results. 150–160 chars ideal."
                  onChange={e => setProduct(p => ({ ...p, seo_description: e.target.value || null }))} />
                <p className="font-heading text-[9px] text-[#333] tracking-wider mt-1">{(product.seo_description ?? '').length}/160 chars recommended</p>
              </Field>
              <Field label="SEO KEYWORDS">
                <input className="admin-input" value={product.seo_keywords ?? ''} placeholder="anime tshirt, oversized tee, gojo satoru shirt..."
                  onChange={e => setProduct(p => ({ ...p, seo_keywords: e.target.value || null }))} />
                <p className="font-heading text-[9px] text-[#333] tracking-wider mt-1">Comma-separated keywords</p>
              </Field>
              <Field label="URL SLUG">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-[10px] text-[#444] whitespace-nowrap">/products/</span>
                  <input className="admin-input flex-1" value={product.slug ?? ''}
                    onChange={e => setProduct(p => ({ ...p, slug: e.target.value }))} />
                </div>
              </Field>
            </div>

            {/* Preview */}
            {(product.seo_title || product.title) && (
              <div className="mt-5 p-4 bg-[#0A0A0A] border border-[#1A1A1A]">
                <p className="font-heading text-[9px] tracking-[0.2em] text-[#333] mb-3">GOOGLE PREVIEW</p>
                <p className="text-[#8AB4F8] text-sm font-sans truncate">{product.seo_title || product.title} — Urban Drip</p>
                <p className="text-[#00C26F] text-[11px] font-sans mt-0.5">urbandrip.net/products/{product.slug}</p>
                <p className="text-[#BDC1C6] text-xs font-sans mt-1 line-clamp-2 leading-relaxed">
                  {product.seo_description || product.description || 'No description set.'}
                </p>
              </div>
            )}
          </Section>

          {/* ── Sizes & Pricing ── always visible ── */}
          <Section title="SIZES & PRICING">
            {isNew ? (
              <div className="space-y-5">
                {/* Size toggles */}
                <div>
                  <p className="font-heading text-[10px] tracking-[0.15em] text-[#444] mb-3">AVAILABLE SIZES</p>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map(size => (
                      <button key={size} type="button" onClick={() => toggleNewSize(size)}
                        className={cn(
                          'px-3 py-1.5 font-heading text-xs tracking-wider border transition-all',
                          newVC.sizes.includes(size)
                            ? 'border-ud-white text-ud-white bg-ud-white/5'
                            : 'border-[#2A2A2A] text-[#444] hover:border-[#444]'
                        )}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shared price/mrp/stock */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="PRICE (₹)">
                    <input type="number" className="admin-input" value={newVC.price}
                      onChange={e => setNewVC(c => ({ ...c, price: Number(e.target.value) }))} />
                  </Field>
                  <Field label="MRP (₹)">
                    <input type="number" className="admin-input" value={newVC.mrp}
                      onChange={e => setNewVC(c => ({ ...c, mrp: Number(e.target.value) }))} />
                  </Field>
                  <Field label="STOCK / SIZE">
                    <input type="number" className="admin-input" value={newVC.stock}
                      onChange={e => setNewVC(c => ({ ...c, stock: Number(e.target.value) }))} />
                  </Field>
                </div>
                <p className="font-heading text-[10px] text-[#444] tracking-wider">
                  These apply to all selected sizes. You can edit per-size after saving.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]">
                      {['SIZE', 'SKU', 'PRICE (₹)', 'MRP (₹)', 'STOCK', 'ACTIVE'].map(h => (
                        <th key={h} className="pb-3 text-left font-heading text-[10px] tracking-[0.15em] text-[#333] pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map(v => (
                      <tr key={v.id} className="border-b border-[#141414]">
                        <td className="py-3 pr-4"><span className="font-heading text-xs tracking-wider text-[#888]">{v.size}</span></td>
                        <td className="py-3 pr-4"><span className="font-heading text-[10px] text-[#444]">{v.sku}</span></td>
                        <td className="py-3 pr-4">
                          <input type="number" className="admin-input w-24 py-1.5 text-sm" value={v.price}
                            onChange={e => updateVariant(v.id, 'price', Number(e.target.value))}
                            onBlur={() => saveVariant(v)} />
                        </td>
                        <td className="py-3 pr-4">
                          <input type="number" className="admin-input w-24 py-1.5 text-sm" value={v.mrp}
                            onChange={e => updateVariant(v.id, 'mrp', Number(e.target.value))}
                            onBlur={() => saveVariant(v)} />
                        </td>
                        <td className="py-3 pr-4">
                          <input type="number" className="admin-input w-20 py-1.5 text-sm" value={v.stock}
                            onChange={e => updateVariant(v.id, 'stock', Number(e.target.value))}
                            onBlur={() => saveVariant(v)} />
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => { updateVariant(v.id, 'is_active', !v.is_active); saveVariant({ ...v, is_active: !v.is_active }) }}
                            className={cn('font-heading text-[10px] tracking-[0.1em] px-2 py-1 transition-colors', v.is_active ? 'text-ud-neon bg-ud-neon/10' : 'text-[#444] bg-[#1A1A1A]')}>
                            {v.is_active ? 'ON' : 'OFF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* ── Right col ── */}
        <div className="space-y-6">

          {/* Status */}
          <Section title="STATUS">
            <div onClick={() => setProduct(p => ({ ...p, is_active: !p.is_active }))}
              className="flex items-center gap-3 cursor-pointer">
              <div className={cn('w-10 h-5 rounded-full relative transition-colors', product.is_active ? 'bg-ud-neon' : 'bg-[#2A2A2A]')}>
                <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform', product.is_active ? 'translate-x-5' : 'translate-x-0.5')} />
              </div>
              <span className="font-heading text-xs tracking-[0.1em] text-[#888]">
                {product.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </Section>

          {/* Images */}
          <Section title="IMAGES">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(product.images ?? []).map((url, i) => (
                <div key={i} className="relative aspect-[3/4] bg-[#1A1A1A] overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(url)}
                    className="absolute top-1 right-1 bg-black/70 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <label className={cn(
                'aspect-[3/4] border border-dashed border-[#2A2A2A] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#444] transition-colors',
                uploading && 'opacity-50 cursor-wait'
              )}>
                <Upload className="w-4 h-4 text-[#444]" />
                <span className="font-heading text-[9px] text-[#444] text-center px-1">{uploading ? 'UPLOADING...' : 'CLICK TO ADD'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            <p className="font-heading text-[9px] text-[#333] tracking-wider">Requires Cloudinary setup in .env.local</p>
          </Section>

          {/* Color preview */}
          <Section title="COLOR">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 border border-[#2A2A2A] flex-shrink-0"
                style={{ background: product.color ?? '#000' }}
              />
              <div className="flex-1">
                <Field label="COLOR NAME">
                  <input className="admin-input" value={product.color ?? ''} placeholder="e.g. Black"
                    onChange={e => setProduct(p => ({ ...p, color: e.target.value, color_map: e.target.value }))} />
                </Field>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#111] border border-[#1E1E1E] p-5', className)}>
      <h3 className="font-heading text-[10px] tracking-[0.2em] text-[#444] mb-4 pb-3 border-b border-[#1A1A1A]">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block font-heading text-[10px] tracking-[0.15em] text-[#444] mb-1.5">{label}</label>
      {children}
    </div>
  )
}
