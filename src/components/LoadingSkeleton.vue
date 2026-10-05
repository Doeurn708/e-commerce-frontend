<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 4 })
</script>

<template>
  <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
    <div v-for="n in count" :key="n" class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <div class="h-48 animate-pulse bg-gray-200 dark:bg-gray-800"></div>
      <div class="space-y-3 p-4">
        <div class="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
        <div class="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
        <div class="flex items-center justify-between">
          <div class="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
          <div class="h-8 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800"></div>
        </div>
      </div>
    </div>
  </div>
</template>