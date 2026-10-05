import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { getProduct } from '../api/products'
import { effectivePrice } from './product'
import type { Product, ProductView } from '../types'

export interface CartItem {
  id: number
  qty: number
}

/** A cart row joined with its product, which is what the UI renders. */
export interface CartLine {
  product: ProductView
  qty: number
}

const CART_KEY = 'ecommerce_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .filter((i): i is CartItem => Boolean(i) && typeof (i as CartItem).id === 'number')
          .map((i) => ({ id: Number(i.id), qty: Math.max(1, Number(i.qty) || 1) }))
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return []
}

function loadSnapshot(): Record<number, ProductView> {
  // Product details are re-fetched on boot (see rehydrate); nothing is cached
  // in localStorage so a price or stock change is never served from a stale row.
  return {}
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: loadCart() as CartItem[],
    /** Snapshot of the product each line points at, for name/price/image. */
    products: loadSnapshot() as Record<number, ProductView>,
    rehydrating: false,
  }),

  getters: {
    totalQty: (state) => state.items.reduce((sum, item) => sum + item.qty, 0),
    isEmpty: (state) => state.items.length === 0,

    /** Lines whose product is loaded. `unresolved` covers a cold page load. */
    lines(state): CartLine[] {
      return state.items
        .map((item) => {
          const product = state.products[item.id]
          return product ? { product, qty: item.qty } : null
        })
        .filter((line): line is CartLine => line !== null)
    },

    unresolvedCount: (state) => state.items.filter((item) => !state.products[item.id]).length,

    subtotal(): number {
      return this.lines.reduce((sum, line) => sum + effectivePrice(line.product) * line.qty, 0)
    },

    /** The backend always prices the order itself; shipping is not charged. */
    total(): number {
      return this.subtotal
    },

    totalItems: (state) => state.items.length,
  },

  actions: {
    persist() {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items))
    },

    /**
     * `source` may be the product itself (keeps the snapshot fresh) or just its
     * id, in which case the details are fetched by rehydrate().
     */
    addItem(source: Product | ProductView | number, qty = 1) {
      const id = typeof source === 'number' ? source : source.id
      const amount = Math.max(1, Math.trunc(qty))

      if (typeof source !== 'number') {
        this.products[id] = source as ProductView
      }

      const existing = this.items.find((item) => item.id === id)
      if (existing) {
        existing.qty += amount
      } else {
        this.items.push({ id, qty: amount })
      }
      this.persist()
    },

    updateQty(id: number, delta: number) {
      const item = this.items.find((entry) => entry.id === id)
      if (!item) return
      item.qty += delta
      if (item.qty <= 0) {
        this.removeItem(id)
      } else {
        this.persist()
      }
    },

    setQty(id: number, qty: number) {
      const item = this.items.find((entry) => entry.id === id)
      if (!item) return
      if (qty <= 0) {
        this.removeItem(id)
        return
      }
      item.qty = Math.max(1, Math.trunc(qty))
      this.persist()
    },

    removeItem(id: number) {
      this.items = this.items.filter((entry) => entry.id !== id)
      delete this.products[id]
      this.persist()
    },

    clear() {
      this.items = []
      this.products = {}
      this.persist()
    },

    /**
     * Fill in any missing product details, dropping lines whose product was
     * deleted on the server so the cart can never show an undefined row.
     */
    async rehydrate(): Promise<void> {
      const missing = this.items.filter((item) => !this.products[item.id])
      if (missing.length === 0) return

      this.rehydrating = true

      try {
        const results = await Promise.allSettled(missing.map((item) => getProduct(item.id)))
        const gone: number[] = []

        results.forEach((result, index) => {
          const id = missing[index].id
          if (result.status === 'fulfilled' && result.value) {
            this.products[id] = result.value
          } else {
            gone.push(id)
          }
        })

        if (gone.length > 0) {
          this.items = this.items.filter((item) => !gone.includes(item.id))
          for (const id of gone) delete this.products[id]
          this.persist()
        }
      } finally {
        this.rehydrating = false
      }
    },
  },
})

export function useCart() {
  const store = useCartStore()
  const { items, products, lines, totalQty, isEmpty, unresolvedCount, subtotal, total, rehydrating } =
    storeToRefs(store)

  return {
    cart: items,
    products,
    lines,
    totalQty,
    isEmpty,
    unresolvedCount,
    subtotal,
    total,
    rehydrating,
    addItem: store.addItem,
    updateQty: store.updateQty,
    setQty: store.setQty,
    removeItem: store.removeItem,
    rehydrate: store.rehydrate,
    clear: store.clear,
  }
}
