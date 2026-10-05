<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { imageUrl } from '../utils/image'
import CategoryCard from './CategoryCard.vue'

const catalog = useCatalogStore()

onMounted(() => {
  if (!catalog.categories.length) catalog.loadCategories().catch(() => undefined)
})

// Counts come from the API (products_count), never from a local tally.
const categoryStats = computed(() => catalog.categoriesWithCount)
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-16">
    <h2 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">{{ $t('categories') }}</h2>
    <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
      <CategoryCard
        v-for="c in categoryStats"
        :key="c.id"
        :name="c.name"
        :image="imageUrl(c.image)"
        :description="c.description"
        :count="c.count"
        :to="{ path: '/shop', query: { category: String(c.id) } }"
      />
    </div>
  </section>
</template>
