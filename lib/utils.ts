import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus, ProductCollection } from '@/types'

// ─── Class name utility ───────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Currency formatting ──────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPriceCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`
  return formatPrice(amount)
}

export function discountPercent(price: number, mrp: number): number {
  if (mrp <= 0) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now  = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours   = Math.floor(diff / 3600000)
  const days    = Math.floor(diff / 86400000)

  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24)   return `${hours}h ago`
  if (days < 30)    return `${days}d ago`
  return formatDate(dateString)
}

// ─── Order number generation ──────────────────────────────────────────────────

export function generateOrderNumber(): string {
  const date  = new Date()
  const y     = date.getFullYear()
  const m     = String(date.getMonth() + 1).padStart(2, '0')
  const d     = String(date.getDate()).padStart(2, '0')
  const rand  = Math.floor(Math.random() * 9000) + 1000
  return `UD-${y}${m}${d}-${rand}`
}

// ─── Slug generation ──────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Loyalty helpers ──────────────────────────────────────────────────────────

export function pointsFromAmount(amount: number): number {
  return Math.floor(amount / 10)
}

export function discountFromPoints(points: number): number {
  return Math.floor(points / 100) * 50
}

// ─── Order status metadata ────────────────────────────────────────────────────

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending:    { label: 'Pending',    color: 'text-yellow-400',  bgColor: 'bg-yellow-400/10' },
  confirmed:  { label: 'Confirmed',  color: 'text-ud-neon',     bgColor: 'bg-ud-neon/10'    },
  processing: { label: 'Processing', color: 'text-ud-blue',     bgColor: 'bg-ud-blue/10'    },
  shipped:    { label: 'Shipped',    color: 'text-ud-purple',   bgColor: 'bg-ud-purple/10'  },
  delivered:  { label: 'Delivered',  color: 'text-ud-neon',     bgColor: 'bg-ud-neon/10'    },
  cancelled:  { label: 'Cancelled',  color: 'text-ud-accent',   bgColor: 'bg-ud-accent/10'  },
  returned:   { label: 'Returned',   color: 'text-ud-muted',    bgColor: 'bg-ud-muted/10'   },
}

// ─── Collection metadata ──────────────────────────────────────────────────────

export const COLLECTION_META: Record<
  ProductCollection,
  { title: string; tagline: string; accentColor: string; gradient: string }
> = {
  anime: {
    title:       'Anime Collection',
    tagline:     'Wear the legend.',
    accentColor: '#8B5CF6',
    gradient:    'from-ud-black via-[#1a0a2e] to-ud-black',
  },
  sports: {
    title:       'Sports Collection',
    tagline:     'Train like a warrior.',
    accentColor: '#3B82F6',
    gradient:    'from-ud-black via-[#0a1628] to-ud-black',
  },
  streetwear: {
    title:       'Streetwear',
    tagline:     'Own the streets.',
    accentColor: '#F97316',
    gradient:    'from-ud-black via-[#1a0f00] to-ud-black',
  },
  ai: {
    title:       'AI Collection',
    tagline:     'The future wears drip.',
    accentColor: '#06B6D4',
    gradient:    'from-ud-black via-[#001a1f] to-ud-black',
  },
  gaming: {
    title:       'Gaming Collection',
    tagline:     'GG. No re. Just drip.',
    accentColor: '#00E87A',
    gradient:    'from-ud-black via-[#001a0d] to-ud-black',
  },
  music: {
    title:       'Music Collection',
    tagline:     'Sound. Style. Swag.',
    accentColor: '#EC4899',
    gradient:    'from-ud-black via-[#1a0012] to-ud-black',
  },
}

// ─── String/text helpers ──────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode)
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─── Array helpers ────────────────────────────────────────────────────────────

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}
