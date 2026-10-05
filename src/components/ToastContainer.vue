<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from '@lucide/vue'
import { useToast } from '../stores/toast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0 translate-x-4"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
      >
        <CheckCircle2
          v-if="toast.type === 'success'"
          class="mt-0.5 h-5 w-5 shrink-0 text-green-500"
        />
        <AlertCircle v-else-if="toast.type === 'error'" class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <Info v-else class="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <p class="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
          {{ toast.message }}
        </p>
        <button
          type="button"
          class="text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close"
          @click="dismiss(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>