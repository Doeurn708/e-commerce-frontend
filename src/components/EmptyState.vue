<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon?: Component
    title: string
    description?: string
    actionLabel?: string
    actionTo?: string
  }>(),
  { icon: undefined, description: '', actionLabel: '', actionTo: '' },
)

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
    <component :is="icon" v-if="icon" class="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
    <div v-else class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600">
      <span class="text-xl">∅</span>
    </div>
    <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">{{ title }}</h2>
    <p v-if="description" class="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
    <RouterLink
      v-if="actionLabel && actionTo"
      :to="actionTo"
      class="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700"
    >
      {{ actionLabel }}
    </RouterLink>
    <button
      v-else-if="actionLabel"
      type="button"
      class="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>