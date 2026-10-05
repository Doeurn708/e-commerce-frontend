<script setup lang="ts">
import { TriangleAlert, X } from '@lucide/vue'

withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    loading?: boolean
  }>(),
  {
    open: false,
    title: 'Are you sure?',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    loading: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="!loading && $emit('cancel')"></div>

        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="open" class="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              class="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              :aria-label="cancelText"
              :disabled="loading"
              @click="$emit('cancel')"
            >
              <X class="h-4 w-4" />
            </button>

            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/40">
              <TriangleAlert class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            <h3 class="mt-4 text-lg font-bold text-gray-900 dark:text-white">{{ title }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                :disabled="loading"
                @click="$emit('cancel')"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                :disabled="loading"
                @click="$emit('confirm')"
              >
                {{ loading ? '...' : confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>