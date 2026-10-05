<script setup lang="ts">
import { computed } from 'vue'
import { SlidersHorizontal, X } from '@lucide/vue'

export interface FilterCategory {
  id: number
  name: string
  slug?: string
  count: number
}

export type PriceRange = 'all' | 'under25' | '25to50' | '50to100'

const props = withDefaults(
  defineProps<{
    categories: FilterCategory[]
    selectedCategoryIds: number[]
    priceRange?: PriceRange
    inStock?: boolean
  }>(),
  { priceRange: 'all', inStock: false },
)

const emit = defineEmits<{
  (e: 'update:selectedCategoryIds', value: number[]): void
  (e: 'update:priceRange', value: PriceRange): void
  (e: 'update:inStock', value: boolean): void
  (e: 'clear'): void
}>()

const priceRanges: { label: string; value: PriceRange }[] = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under $25', value: 'under25' },
  { label: '$25 - $50', value: '25to50' },
  { label: '$50 - $100', value: '50to100' },
]

const activeCount = computed(
  () =>
    props.selectedCategoryIds.length +
    (props.priceRange !== 'all' ? 1 : 0) +
    (props.inStock ? 1 : 0),
)

function toggleCategory(id: number) {
  const current = props.selectedCategoryIds
  emit(
    'update:selectedCategoryIds',
    current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
  )
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
        <SlidersHorizontal class="h-4 w-4 text-indigo-600" />
        {{ $t('filters') }}
        <span v-if="activeCount" class="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">{{ activeCount }}</span>
      </h2>
      <button
        v-if="activeCount"
        type="button"
        class="flex items-center gap-1 text-xs font-medium text-red-500 transition hover:underline"
        @click="emit('clear')"
      >
        <X class="h-3 w-3" />
        {{ $t('clear') }}
      </button>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{{ $t('categories') }}</h3>
      <label
        v-for="c in categories"
        :key="c.id"
        class="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-gray-700 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
      >
        <input
          type="checkbox"
          :checked="selectedCategoryIds.includes(c.id)"
          class="h-4 w-4 rounded accent-indigo-600"
          @change="toggleCategory(c.id)"
        />
        <span class="flex-1">{{ c.name }}</span>
        <span class="text-xs text-gray-400">{{ c.count }}</span>
      </label>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{{ $t('price') }}</h3>
      <label
        v-for="range in priceRanges"
        :key="range.value"
        class="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-gray-700 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
      >
        <input
          :checked="priceRange === range.value"
          type="radio"
          class="h-4 w-4 accent-indigo-600"
          @change="emit('update:priceRange', range.value)"
        />
        {{ range.label }}
      </label>
    </div>

    <label class="flex cursor-pointer items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        :checked="inStock"
        class="h-4 w-4 rounded accent-indigo-600"
        @change="emit('update:inStock', ($event.target as HTMLInputElement).checked)"
      />
      <span class="flex-1">{{ $t('inStockOnly') }}</span>
    </label>
  </div>
</template>