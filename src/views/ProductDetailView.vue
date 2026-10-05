<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Heart, ShoppingCart, Zap, Minus, Plus, Truck, ShieldCheck } from '@lucide/vue'
import ProductGrid from '../components/ProductGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import { getProduct, getRelatedProducts } from '../api/products'
import { useCart } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import { useWishlist } from '../stores/wishlist'
import { toastSuccess } from '../stores/toast'
import { t } from '../stores/i18n'
import { discountPercent, effectivePrice, hasRating } from '../stores/product'
import { imageUrl, onImageError } from '../utils/image'
import type { Product, Review } from '../types'

const route = useRoute()
const router = useRouter()
const { addItem } = useCart()
const catalog = useCatalogStore()
const { isFavorite, toggle } = useWishlist()

const product = ref<Product | null>(null)
const related = ref<Product[]>([])
const loading = ref(true)
const error = ref('')

const qty = ref(1)
const activeTab = ref<'description' | 'specifications' | 'reviews'>('description')

/**
 * The Laravel API exposes no reviews resource yet, so this list stays empty
 * until that endpoint exists rather than showing invented customer quotes.
 * normalizeReviews() is kept in the API layer ready for it.
 */
const reviews = computed<Review[]>(() => [])

const price = computed(() => (product.value ? effectivePrice(product.value) : 0))
const discount = computed(() => (product.value ? discountPercent(product.value) : null))
const available = computed(() => (product.value ? product.value.stock > 0 : false))
const rated = computed(() => (product.value ? hasRating(product.value) : false))
const mainImage = computed(() => imageUrl(product.value?.image))

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    product.value = await getProduct(route.params.id as string)
    // Share the row with the catalog/cart so adding to cart needs no refetch.
    catalog.mergeProducts([product.value])
    related.value = await getRelatedProducts(product.value.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load product'
  } finally {
    loading.value = false
  }
})

function decQty() {
  if (qty.value > 1) qty.value--
}
function incQty() {
  if (qty.value < 10 && product.value && qty.value < product.value.stock) qty.value++
}

function addToCart() {
  if (!product.value) return
  addItem(product.value, qty.value)
  toastSuccess(t('addedToCart', { name: product.value.name }))
}

function buyNow() {
  if (!product.value) return
  addItem(product.value, qty.value)
  router.push('/cart')
}

function toggleWishlist() {
  if (!product.value) return
  const added = toggle(product.value.id)
  toastSuccess(
    added
      ? t('addedToWishlist', { name: product.value.name })
      : t('removedFromWishlist', { name: product.value.name }),
  )
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <nav class="mb-8 text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/" class="hover:text-indigo-600">{{ $t('home') }}</RouterLink>
      <span class="mx-2">/</span>
      <RouterLink to="/shop" class="hover:text-indigo-600">{{ $t('shop') }}</RouterLink>
      <span class="mx-2">/</span>
      <span class="text-gray-900 dark:text-gray-100">{{ product?.name }}</span>
    </nav>

    <div v-if="loading" class="grid gap-10 lg:grid-cols-2">
      <div class="h-96 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800"></div>
      <div class="space-y-4">
        <div class="h-5 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800"></div>
        <div class="h-8 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"></div>
        <div class="h-10 w-40 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800"></div>
        <div class="h-24 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"></div>
        <div class="h-12 w-64 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800"></div>
      </div>
    </div>

    <EmptyState
      v-else-if="error"
      :title="$t('productNotFound')"
      :description="error"
      :action-label="$t('backToShop')"
      @action="router.push('/shop')"
    />

    <div v-else-if="product" class="grid gap-10 lg:grid-cols-2">
      <div>
        <div class="relative overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
          <img :src="mainImage" :alt="product.name" class="aspect-square w-full object-cover" @error="onImageError" />
          <button
            type="button"
            class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 dark:bg-gray-900/90"
            :aria-label="'Wishlist'"
            @click="toggleWishlist"
          >
            <Heart
              class="h-5 w-5"
              :class="isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-300'"
            />
          </button>
          <span
            v-if="discount"
            class="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow"
          >
            -{{ discount }}%
          </span>
        </div>
      </div>

      <div>
        <span class="text-sm font-medium uppercase tracking-wide text-indigo-500">{{ product.category?.name ?? product.category }}</span>
        <h1 class="mt-2 text-4xl font-bold text-gray-900 dark:text-white">{{ product.name }}</h1>

        <div v-if="rated" class="mt-3 flex items-center gap-2">
          <span class="flex items-center gap-1">
            <svg
              v-for="n in 5"
              :key="n"
              class="h-5 w-5"
              :class="n <= Math.round(product.rating ?? 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ product.rating?.toFixed(1) }} ({{ product.reviews_count ?? 0 }} {{ $t('reviews') }})
          </span>
        </div>
        <p v-else class="mt-3 text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>

        <div class="mt-4 flex items-baseline gap-3">
          <p class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">${{ price.toFixed(2) }}</p>
          <p v-if="discount" class="text-lg text-gray-400 line-through">${{ product.price.toFixed(2) }}</p>
        </div>

        <span
          class="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          :class="available ? 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400'"
        >
          {{ available ? $t('inStock') : $t('outOfStock') }}
          <template v-if="available">· {{ product.stock }} {{ $t('inStockCount') }}</template>
        </span>

        <p class="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">{{ product.description }}</p>

        <div class="mt-6 flex items-center gap-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('quantity') }}</span>
          <div class="flex items-center rounded-full border border-gray-300 dark:border-gray-600">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-l-full text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800"
              @click="decQty"
              :aria-label="$t('decrease')"
            >
              <Minus class="h-4 w-4" />
            </button>
            <span class="w-10 text-center text-sm font-semibold text-gray-900 dark:text-white">{{ qty }}</span>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-r-full text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800"
              @click="incQty"
              :aria-label="$t('increase')"
            >
              <Plus class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            :disabled="!available"
            class="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            @click="addToCart"
          >
            <ShoppingCart class="h-4 w-4" />
            {{ $t('addToCart') }}
          </button>
          <button
            type="button"
            :disabled="!available"
            class="flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            @click="buyNow"
          >
            <Zap class="h-4 w-4" />
            {{ $t('buyNow') }}
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:text-red-500 dark:border-gray-600 dark:text-gray-200"
            @click="toggleWishlist"
          >
            <Heart class="h-4 w-4" :class="isFavorite(product.id) ? 'fill-red-500 text-red-500' : ''" />
            {{ isFavorite(product.id) ? $t('inWishlist') : $t('wishlist') }}
          </button>
        </div>

        <div class="mt-8 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2">
          <p class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Truck class="h-4 w-4 text-indigo-600" /> {{ $t('freeShipping') }}
          </p>
          <p class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <ShieldCheck class="h-4 w-4 text-indigo-600" /> {{ $t('securePayment') }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="product" class="mt-16">
      <div class="flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in ['description', 'specifications', 'reviews'] as const"
          :key="tab"
          type="button"
          :class="activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'"
          class="whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition"
          @click="activeTab = tab"
        >
          {{ $t(tab === 'specifications' ? 'specifications' : tab === 'reviews' ? 'reviews' : 'description') }}
          <template v-if="tab === 'reviews'"> ({{ product.reviews_count ?? 0 }})</template>
        </button>
      </div>

      <div class="py-8">
        <p v-if="activeTab === 'description'" class="max-w-3xl whitespace-pre-line leading-relaxed text-gray-600 dark:text-gray-300">
          {{ product.description }}
        </p>

        <div v-else-if="activeTab === 'specifications'" class="max-w-3xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <span>Specification</span>
            <span>Value</span>
          </div>
          <div class="grid grid-cols-2 gap-x-4 px-4 py-3 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Category</span>
            <span class="font-medium text-gray-800 dark:text-gray-100">{{ product.category?.name ?? '—' }}</span>
            <span class="mt-2 text-gray-500 dark:text-gray-400">Slug</span>
            <span class="mt-2 font-medium text-gray-800 dark:text-gray-100">{{ product.slug }}</span>
            <span class="mt-2 text-gray-500 dark:text-gray-400">Availability</span>
            <span class="mt-2 font-medium text-gray-800 dark:text-gray-100">{{ product.stock > 0 ? $t('inStock') : $t('outOfStock') }}</span>
            <span class="mt-2 text-gray-500 dark:text-gray-400">Last updated</span>
            <span class="mt-2 font-medium text-gray-800 dark:text-gray-100">{{ product.updated_at ?? '—' }}</span>
          </div>
        </div>

        <div v-else class="max-w-3xl space-y-6">
          <article
            v-for="review in reviews"
            :key="review.id"
            class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div class="mb-1 flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ review.user_name }}</span>
              <span class="flex items-center gap-0.5 text-amber-400">
                <svg v-for="n in review.rating" :key="n" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ review.comment }}</p>
          </article>

          <p
            v-if="reviews.length === 0"
            class="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
          >
            There are no reviews for this product yet.
          </p>
        </div>
      </div>
    </div>

    <div v-if="related.length" class="mt-8">
      <ProductGrid title-key="youMayAlsoLike" :products="related" :cols="4" />
    </div>
  </section>
</template>