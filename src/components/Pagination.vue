<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    total?: number
    perPage?: number
    pageSizes?: number[]
    summaryText?: string
  }>(),
  {
    total: 0,
    perPage: 10,
    pageSizes: () => [10, 20, 50, 100],
    summaryText: '',
  },
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:perPage', perPage: number): void
}>()

function go(page: number) {
  if (page < 1 || page > props.totalPages) return
  emit('update:page', page)
}

function range(): number[] {
  const pages: number[] = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

function from(): number {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.perPage + 1
}

function displayTo(): number {
  if (props.total === 0) return 0
  return Math.min(props.currentPage * props.perPage, props.total)
}

function safeSummary(): string {
  if (props.summaryText) {
    return props.summaryText
      .replace('{from}', String(from()))
      .replace('{to}', String(displayTo()))
      .replace('{total}', String(props.total))
  }
  return `Showing ${from()}–${displayTo()} of ${props.total}`
}

const showSummary = computed(() => props.total > 0)

function onPerPageChange(event: Event) {
  emit('update:perPage', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
    <div v-if="showSummary" class="flex items-center gap-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ safeSummary() }}</p>
      <label class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span class="hidden sm:inline">Per page</span>
        <select
          :value="perPage"
          class="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          @change="onPerPageChange"
        >
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
    </div>
    <nav v-else-if="totalPages > 1" class="flex items-center justify-center gap-2" aria-label="Pagination" />

    <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2 sm:ml-auto" aria-label="Pagination">
      <button
        type="button"
        :disabled="currentPage <= 1"
        class="flex h-10 items-center gap-1 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-indigo-900/40"
        @click="go(currentPage - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
        <span class="hidden sm:inline">Prev</span>
      </button>

      <button
        v-for="page in range()"
        :key="page"
        type="button"
        :class="page === currentPage
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
          : 'bg-white text-gray-700 hover:bg-indigo-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-indigo-900/40'"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-sm font-medium transition dark:border-gray-700"
        @click="go(page)"
      >
        {{ page }}
      </button>

      <button
        type="button"
        :disabled="currentPage >= totalPages"
        class="flex h-10 items-center gap-1 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-indigo-900/40"
        @click="go(currentPage + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <ChevronRight class="h-4 w-4" />
      </button>
    </nav>
  </div>
</template>