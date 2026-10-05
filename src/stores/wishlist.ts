import { computed, ref } from 'vue'

const WISHLIST_KEY = 'ecommerce_wishlist'

function loadWishlist(): number[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    if (raw) return JSON.parse(raw) as number[]
  } catch {
    /* ignore corrupt storage */
  }
  return []
}

const wishlist = ref<number[]>(loadWishlist())

function persist() {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist.value))
}

const isFavorite = (id: number) => wishlist.value.includes(id)
const count = computed(() => wishlist.value.length)

function toggle(id: number): boolean {
  if (wishlist.value.includes(id)) {
    wishlist.value = wishlist.value.filter((entry) => entry !== id)
    persist()
    return false
  }
  wishlist.value.push(id)
  persist()
  return true
}

function remove(id: number) {
  wishlist.value = wishlist.value.filter((entry) => entry !== id)
  persist()
}

export function useWishlist() {
  return { wishlist, count, isFavorite, toggle, remove }
}