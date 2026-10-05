<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    status: string
    type?: 'order' | 'payment'
  }>(),
  { type: 'order' },
)

const tone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  refunded: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

const dot: Record<string, string> = {
  pending: 'bg-amber-500',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  paid: 'bg-green-500',
  unpaid: 'bg-amber-500',
  refunded: 'bg-gray-400',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
    :class="tone[props.status.toLowerCase()] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="dot[props.status.toLowerCase()] ?? 'bg-gray-400'"></span>
    {{ $t(props.status.toLowerCase()) }}
  </span>
</template>