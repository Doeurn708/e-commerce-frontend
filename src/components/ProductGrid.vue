<script setup lang="ts">
import type { ProductView } from '../types'
import ProductCard from './ProductCard.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

const props = withDefaults(
  defineProps<{
    titleKey: string
    products: ProductView[]
    loading?: boolean
    cols?: 2 | 3 | 4 | 6
  }>(),
  { loading: false, cols: 4 },
)

const gridClass = {
  2: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2',
  3: 'grid grid-cols-2 gap-6 lg:grid-cols-3',
  4: 'grid grid-cols-2 gap-6 lg:grid-cols-4',
  6: 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6',
}[props.cols]
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-16">
    <h2 v-if="titleKey" class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">{{ $t(titleKey) }}</h2>
    <LoadingSkeleton v-if="loading" :count="props.cols >= 4 ? 4 : props.cols" />
    <div v-else :class="gridClass">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </section>
</template>