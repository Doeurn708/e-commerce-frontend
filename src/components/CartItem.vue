<script setup lang="ts">
import { computed } from 'vue'
import { Trash } from '@lucide/vue'
import { useCart } from '../stores/cart'
import { toastSuccess } from '../stores/toast'
import { t } from '../stores/i18n'
import { effectivePrice } from '../stores/product'
import { imageUrl, onImageError } from '../utils/image'
import type { ProductView } from '../types'

const props = defineProps<{
  product: ProductView
  qty: number
}>()

const { updateQty, removeItem } = useCart()

const unitPrice = computed(() => effectivePrice(props.product))
const lineTotal = computed(() => unitPrice.value * props.qty)
const to = computed(() => `/product/${props.product.slug ?? props.product.id}`)

function remove() {
  removeItem(props.product.id)
  toastSuccess(t('removedFromCart', { name: props.product.name }))
}
</script>

<template>
  <div class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <RouterLink :to="to" class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600">
      <img
        :src="imageUrl(product.image)"
        :alt="product.name"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="onImageError"
      />
    </RouterLink>
    <div class="min-w-0 flex-1">
      <RouterLink :to="to" class="truncate font-semibold text-gray-800 hover:text-indigo-600 dark:text-gray-100">
        {{ product.name }}
      </RouterLink>
      <p class="text-sm text-gray-500 dark:text-gray-400">${{ unitPrice.toFixed(2) }} each</p>
      <div class="mt-2 flex items-center gap-2">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-indigo-600 dark:border-gray-600 dark:text-gray-300"
          @click="updateQty(product.id, -1)"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span class="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{{ qty }}</span>
        <button
          type="button"
          :disabled="product.stock !== undefined && qty >= product.stock"
          class="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
          @click="updateQty(product.id, 1)"
          aria-label="Increase quantity"
        >
          +
        </button>
        <button type="button" class="ml-4 flex items-center gap-1 text-sm text-red-500 transition hover:underline" @click="remove">
          <Trash class="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
    <span class="font-bold text-gray-900 dark:text-white">${{ lineTotal.toFixed(2) }}</span>
  </div>
</template>