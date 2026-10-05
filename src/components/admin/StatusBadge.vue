<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: string | number | null | undefined
    label?: string
    tone?: 'auto' | 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'violet'
  }>(),
  { value: '', label: '', tone: 'auto' },
)

const AUTO_TONES: Record<string, string> = {
  pending: 'amber',
  processing: 'blue',
  shipped: 'violet',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
  paid: 'green',
  unpaid: 'amber',
  refunded: 'gray',
  active: 'green',
  inactive: 'gray',
  suspended: 'red',
}

const toneClasses: Record<string, string> = {
  green:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  amber:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30',
  gray: 'bg-gray-100 text-gray-600 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30',
  violet:
    'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30',
}

const displayLabel = computed(() => (props.label ? props.label : String(props.value ?? '')))

const resolvedTone = computed(() => {
  if (props.tone !== 'auto') return props.tone
  return AUTO_TONES[String(props.value ?? '').toLowerCase()] ?? 'gray'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset"
    :class="toneClasses[resolvedTone]"
  >
    {{ displayLabel }}
  </span>
</template>