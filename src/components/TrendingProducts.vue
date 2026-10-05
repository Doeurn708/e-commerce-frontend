<script setup lang="ts">
import { AlertCircle, ArrowRight, PackageOpen } from '@lucide/vue'
import type { Product } from '../types'
import ProductCard from './ProductCard.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

/**
 * ---------------------------------------------------------------------------
 * Trending Products
 * ---------------------------------------------------------------------------
 * The home page section. It renders whatever the catalog store hands it, which
 * keeps the three states (loading / error / empty) explicit at the call site
 * instead of hiding a request inside the component.
 *
 * Rows are real: ProductController::trending() ranks them by the units sold in
 * non-cancelled orders. Nothing here is a hardcoded product.
 */

withDefaults(
  defineProps<{
    products: Product[]
    loading?: boolean
    error?: string
  }>(),
  { loading: false, error: '' },
)

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-16">
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <span class="h-6 w-1.5 rounded-full bg-indigo-600"></span>
          {{ $t('trendingProducts') }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $t('trendingSubtitle') }}</p>
      </div>

      <RouterLink
        to="/shop"
        class="hidden shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 transition-all hover:gap-2 dark:text-indigo-400 sm:flex"
      >
        {{ $t('viewAll') }}
        <ArrowRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <LoadingSkeleton v-if="loading" :count="4" />

    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 py-12 text-center dark:border-red-900/60"
    >
      <AlertCircle class="mb-3 h-8 w-8 text-red-400" />
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('trendingLoadFailed') }}</p>
      <button
        type="button"
        class="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
        @click="emit('retry')"
      >
        {{ $t('tryAgain') }}
      </button>
    </div>

    <div
      v-else-if="!products.length"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700"
    >
      <PackageOpen class="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('trendingEmpty') }}</p>
      <RouterLink
        to="/shop"
        class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:gap-2 dark:text-indigo-400"
      >
        {{ $t('browseProducts') }}
        <ArrowRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <RouterLink
      v-if="!loading && !error && products.length"
      to="/shop"
      class="mt-8 flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 transition hover:gap-2 dark:text-indigo-400 sm:hidden"
    >
      {{ $t('viewAll') }}
      <ArrowRight class="h-4 w-4" />
    </RouterLink>
  </section>
</template>
