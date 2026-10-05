<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { getProduct } from '../api/products'
import { useCatalogStore } from '../stores/catalog'
import { useWishlist } from '../stores/wishlist'
import { useI18n } from '../stores/i18n'
import { Heart } from '@lucide/vue'
import type { Product } from '../types'

const { wishlist } = useWishlist()
const { t } = useI18n()
const catalog = useCatalogStore()

const items = ref<Product[]>([])
const loading = ref(false)

/**
 * The wishlist only stores product ids, so the rows are resolved through the
 * catalog and, for anything not cached yet, through GET /api/products/{id}.
 */
async function resolve() {
  if (wishlist.value.length === 0) {
    items.value = []
    return
  }

  loading.value = true
  try {
    const resolved = await Promise.all(
      wishlist.value.map((id) => catalog.findProduct(id) ?? getProduct(id)),
    )
    items.value = resolved.filter((p): p is Product => Boolean(p))
    catalog.mergeProducts(items.value)
  } catch {
    // Keep whatever could be resolved; the empty state covers the rest.
  } finally {
    loading.value = false
  }
}

onMounted(resolve)
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="mb-6 text-xl font-bold text-gray-900 dark:text-white">{{ $t('wishlist') }} ({{ items.length }})</h2>

    <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="n in 3" :key="n" class="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
    </div>

    <div v-else-if="items.length" class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <ProductCard v-for="product in items" :key="product.id" :product="product" />
    </div>

    <EmptyState
      v-else
      :icon="Heart"
      :title="t('emptyWishlist')"
      :description="$t('browseProducts')"
      :action-label="$t('browseProducts')"
      action-to="/shop"
    />
  </div>
</template>
