'use client'

import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ProductFilters } from '@/types'

interface Props {
  currentFilters: ProductFilters
}

const COLLECTIONS = [
  { label: 'All',        value: ''           },
  { label: 'Anime',      value: 'anime'      },
  { label: 'Gymwear',    value: 'gymwear'    },
  { label: 'Pickleball', value: 'pickleball' },
]

const FIT_TYPES = [
  { label: 'All Fits',  value: ''          },
  { label: 'Regular',   value: 'regular'   },
  { label: 'Oversized', value: 'oversized' },
]

const SORT_OPTIONS = [
  { label: 'Newest',       value: 'newest'     },
  { label: 'Price: Low',   value: 'price_asc'  },
  { label: 'Price: High',  value: 'price_desc' },
]

export function ProductFiltersBar({ currentFilters }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    if (currentFilters.collection && key !== 'collection') params.set('collection', currentFilters.collection)
    if (currentFilters.fit_type   && key !== 'fit_type')   params.set('fit_type',   currentFilters.fit_type)
    if (currentFilters.sort       && key !== 'sort')        params.set('sort',        currentFilters.sort)
    if (currentFilters.search     && key !== 'search')      params.set('search',      currentFilters.search)
    if (value) params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-8">
      {/* Sort (mobile: inline) */}
      <div>
        <p className="input-label mb-3">SORT BY</p>
        <div className="flex flex-row lg:flex-col gap-2">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('sort', opt.value)}
              className={cn(
                'text-left px-3 py-2 text-sm font-sans rounded-sm transition-colors',
                (currentFilters.sort ?? 'newest') === opt.value
                  ? 'bg-ud-accent/10 text-ud-accent border border-ud-accent/30'
                  : 'text-ud-muted hover:text-ud-white hover:bg-ud-gray'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Collection */}
      <div>
        <p className="input-label mb-3">COLLECTION</p>
        <div className="flex flex-row flex-wrap lg:flex-col gap-2">
          {COLLECTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('collection', opt.value)}
              className={cn(
                'text-left px-3 py-2 text-sm font-sans rounded-sm transition-colors',
                (currentFilters.collection ?? '') === opt.value
                  ? 'bg-ud-accent/10 text-ud-accent border border-ud-accent/30'
                  : 'text-ud-muted hover:text-ud-white hover:bg-ud-gray'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fit type */}
      <div>
        <p className="input-label mb-3">FIT TYPE</p>
        <div className="flex flex-row flex-wrap lg:flex-col gap-2">
          {FIT_TYPES.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('fit_type', opt.value)}
              className={cn(
                'text-left px-3 py-2 text-sm font-sans rounded-sm transition-colors',
                (currentFilters.fit_type ?? '') === opt.value
                  ? 'bg-ud-accent/10 text-ud-accent border border-ud-accent/30'
                  : 'text-ud-muted hover:text-ud-white hover:bg-ud-gray'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
