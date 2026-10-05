<script setup lang="ts">
import { Heart, ShoppingCart } from '@lucide/vue'
import type { ProductView } from '../types'
import { useCart } from '../stores/cart'
import { useWishlist } from '../stores/wishlist'
import { toastSuccess } from '../stores/toast'
import { t } from '../stores/i18n'
import { effectivePrice, discountPercent, hasRating, inStock } from '../stores/product'
import { imageUrl, onImageError } from '../utils/image'

const props = defineProps<{
  product: ProductView
}>()

const { addItem } = useCart()
const { isFavorite, toggle } = useWishlist()

const price = effectivePrice(props.product)
const discount = discountPercent(props.product)
const available = inStock(props.product)

const categoryName = typeof props.product.category === 'string' ? props.product.category : (props.product.category?.name ?? '')
// The backend has no reviews table yet, so the rating block is hidden until
// there is something real to show instead of a fake "0 (0)".
const rated = hasRating(props.product)
const reviewsCount = props.product.reviews_count ?? 0
const image = imageUrl(props.product.image)

function addToCart() {
  if (!available) return
  addItem(props.product)
  toastSuccess(t('addedToCart', { name: props.product.name }))
}

function toggleWishlist() {
  const added = toggle(props.product.id)
  toastSuccess(
    added
      ? t('addedToWishlist', { name: props.product.name })
      : t('removedFromWishlist', { name: props.product.name }),
  )
}
</script>

<template>
  <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-900">
    <div class="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
      <span
        v-if="discount"
        class="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow"
      >
        -{{ discount }}%
      </span>
      <span
        v-if="!available"
        class="rounded-full bg-gray-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
      >
        {{ $t('outOfStock') }}
      </span>
    </div>

    <button
      type="button"
      class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 dark:bg-gray-800/90"
      :aria-label="'Wishlist'"
      @click="toggleWishlist"
    >
      <Heart
        class="h-4 w-4 transition"
        :class="isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-300'"
      />
    </button>

    <RouterLink
      :to="`/product/${product.slug ?? product.id}`"
      class="block h-44 overflow-hidden bg-gray-100 dark:bg-gray-800"
      :aria-label="product.name"
    >
      <img
        :src="image"
        :alt="product.name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
        @error="onImageError"
      />
    </RouterLink>

    <div class="flex flex-1 flex-col p-4">
      <span class="text-xs font-medium uppercase tracking-wide text-indigo-500">{{ categoryName }}</span>
      <h3 class="mt-1 line-clamp-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
        <RouterLink :to="`/product/${product.slug ?? product.id}`" class="transition hover:text-indigo-600">{{ product.name }}</RouterLink>
      </h3>
      <p class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{{ product.description }}</p>

      <div class="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <template v-if="rated">
          <svg class="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {{ product.rating?.toFixed(1) }} ({{ reviewsCount }})
        </template>
        <span v-else class="text-gray-400 dark:text-gray-500">No reviews yet</span>
        <span class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium" :class="available ? 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400'">
          {{ available ? $t('inStock') : $t('outOfStock') }}
        </span>
      </div>

      <div class="mt-3 flex items-end justify-between gap-2">
        <div>
          <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ price.toFixed(2) }}</span>
          <span v-if="discount" class="ml-2 text-xs text-gray-400 line-through">${{ product.price.toFixed(2) }}</span>
        </div>
        <button
          type="button"
          :disabled="!available"
          class="flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-indigo-500"
          @click="addToCart"
        >
          <ShoppingCart class="h-3.5 w-3.5" />
          {{ available ? $t('addToCart') : $t('outOfStock') }}
        </button>
      </div>
    </div>
  </article>
</template>