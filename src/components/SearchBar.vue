<script setup lang="ts">
import { Search, X } from '@lucide/vue'

defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="relative w-full">
    <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder ?? $t('search')"
      class="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-11 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      :aria-label="$t('clear')"
      @click="emit('update:modelValue', '')"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
</template>