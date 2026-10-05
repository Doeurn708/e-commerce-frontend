<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

interface Props {
  type?: 'submit' | 'button'
  loading?: boolean
  loadingText?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'submit',
  loading: false,
  loadingText: '',
  disabled: false,
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.loading || props.disabled"
    class="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#4338CA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-[#111827]"
  >
    <Loader2 v-if="props.loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
    <span v-if="props.loading && props.loadingText">{{ props.loadingText }}</span>
    <slot v-else />
  </button>
</template>