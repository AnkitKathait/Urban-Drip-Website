'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export interface CartLineItem {
  variant_id:    string
  product_id:    string
  product_title: string
  slug:          string
  size:          string
  price:         number
  mrp:           number
  image:         string
  quantity:      number
}

interface CartStore {
  items:         CartLineItem[]
  isOpen:        boolean
  openCart:      () => void
  closeCart:     () => void
  toggleCart:    () => void
  addItem:       (item: CartLineItem) => void
  removeItem:    (variant_id: string) => void
  updateQty:     (variant_id: string, qty: number) => void
  clearCart:     () => void
  itemCount:     number
  subtotal:      number
}

function derive(items: CartLineItem[]) {
  return {
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal:  items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  }
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items:     [],
      isOpen:    false,
      itemCount: 0,
      subtotal:  0,

      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

      addItem: (item) => {
        const existing = get().items.find(i => i.variant_id === item.variant_id)
        let nextItems: CartLineItem[]

        if (existing) {
          const newQty = Math.min(existing.quantity + item.quantity, 10)
          nextItems = get().items.map(i =>
            i.variant_id === item.variant_id ? { ...i, quantity: newQty } : i
          )
          toast.success(`Updated to ${newQty} in cart`)
        } else {
          nextItems = [...get().items, item]
          toast.success(`${item.product_title} added to cart`)
        }

        set({ items: nextItems, isOpen: true, ...derive(nextItems) })
      },

      removeItem: (variant_id) => {
        const nextItems = get().items.filter(i => i.variant_id !== variant_id)
        set({ items: nextItems, ...derive(nextItems) })
      },

      updateQty: (variant_id, qty) => {
        if (qty < 1) { get().removeItem(variant_id); return }
        const nextItems = get().items.map(i =>
          i.variant_id === variant_id ? { ...i, quantity: Math.min(qty, 10) } : i
        )
        set({ items: nextItems, ...derive(nextItems) })
      },

      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),
    }),
    {
      name:    'ud-cart',
      version: 2,
      // Rehydrate derived values from persisted items on load
      onRehydrateStorage: () => (state) => {
        if (state) Object.assign(state, derive(state.items))
      },
    }
  )
)
