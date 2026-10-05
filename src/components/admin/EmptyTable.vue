<script setup lang="ts">
import { Inbox } from '@lucide/vue'

withDefaults(
  defineProps<{
    message?: string
    actionLabel?: string
  }>(),
  { message: 'No records found', actionLabel: '' },
)

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
      <Inbox class="h-7 w-7" />
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>