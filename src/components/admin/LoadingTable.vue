<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
  }>(),
  { rows: 6 },
)
</script>

<template>
  <div class="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
    <div class="divide-y divide-gray-100 dark:divide-gray-800">
      <div v-for="i in rows" :key="i" class="animate-pulse px-4 py-4 sm:px-6">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-3 w-1/4 rounded bg-gray-100 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>