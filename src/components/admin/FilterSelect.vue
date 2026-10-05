<script setup lang="ts">
import { computed } from 'vue'

export type FilterOption = string | { value: string; label: string }

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    options: FilterOption[]
    allLabel?: string
    ariaLabel?: string
  }>(),
  { modelValue: '', allLabel: 'All', ariaLabel: 'Filter' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const normalized = computed(() =>
  props.options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  ),
)

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value === '' ? '' : value)
}
</script>

<template>
  <select
    :value="modelValue === '' || modelValue === undefined ? '' : String(modelValue)"
    :aria-label="ariaLabel"
    class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 pr-8 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
    @change="onChange"
  >
    <option value="">{{ allLabel }}</option>
    <option v-for="option in normalized" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>