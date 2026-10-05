<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { imageUrl, onImageError } from '../utils/image'

withDefaults(
  defineProps<{
    name: string
    icon?: string
    image?: string
    description?: string
    count?: number
    to?: RouteLocationRaw
  }>(),
  { icon: '', image: '', description: '', count: 0, to: undefined },
)
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-indigo-600 hover:shadow-xl dark:border-gray-700 dark:bg-gray-900"
  >
    <div class="relative flex h-32 items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img
        v-if="image"
        :src="imageUrl(image)"
        :alt="name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        loading="lazy"
        @error="onImageError"
      />
      <span v-else class="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/50 dark:text-indigo-300">
        <svg v-if="icon" class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
        </svg>
        <svg v-else class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </span>
      <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur dark:bg-gray-900/90 dark:text-gray-200">
        {{ $t('categoryCount', { n: count }) }}
      </span>
    </div>

    <div class="p-4">
      <p class="font-semibold text-gray-800 dark:text-gray-100">{{ name }}</p>
      <p v-if="description" class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{{ description }}</p>
      <span
        class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition group-hover:gap-2 dark:text-indigo-400"
      >
        {{ $t('viewProducts') }}
        <span aria-hidden="true">→</span>
      </span>
    </div>
  </component>
</template>