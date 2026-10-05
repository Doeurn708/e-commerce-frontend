<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    ariaLabel?: string
    debounce?: number
  }>(),
  { placeholder: 'Search...', ariaLabel: 'Search', debounce: 300 },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const localValue = ref(props.modelValue)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (value) => {
    if (value !== localValue.value) localValue.value = value
  },
)

function onInput(value: string) {
  localValue.value = value
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', value), props.debounce)
}

function clear() {
  localValue.value = ''
  if (timer) clearTimeout(timer)
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="relative min-w-0 flex-1">
    <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      type="search"
      :value="localValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      class="h-11 w-full rounded-full border border-gray-200 bg-white pl-11 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="localValue"
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      :aria-label="'Clear search'"
      @click="clear"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>