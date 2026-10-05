<script setup lang="ts">
import CategoryCard from './CategoryCard.vue'
import { imageUrl } from '../utils/image'

export interface CategoryGridItem {
  id?: number
  name: string
  slug?: string
  icon?: string
  image?: string
  description?: string
  count: number
}

const props = withDefaults(
  defineProps<{
    categories: CategoryGridItem[]
    cols?: 2 | 3 | 4 | 6
  }>(),
  { cols: 4 },
)

const gridClass = {
  2: 'grid grid-cols-1 gap-6 sm:grid-cols-2',
  3: 'grid grid-cols-2 gap-6 lg:grid-cols-3',
  4: 'grid grid-cols-2 gap-6 lg:grid-cols-4',
  6: 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6',
}[props.cols]
</script>

<template>
  <div :class="gridClass">
    <CategoryCard
      v-for="c in categories"
      :key="c.id ?? c.name"
      :name="c.name"
      :icon="c.icon"
      :image="imageUrl(c.image)"
      :description="c.description"
      :count="c.count"
      :to="{ path: '/shop', query: { category: c.slug ?? String(c.id ?? c.name) } }"
    />
  </div>
</template>