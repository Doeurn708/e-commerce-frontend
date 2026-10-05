  <script setup lang="ts" generic="T">
import { useSlots } from 'vue'
import LoadingTable from './LoadingTable.vue'
import EmptyTable from './EmptyTable.vue'

export interface AdminColumn {
  key: string
  label: string
  className?: string
}

const props = withDefaults(
  defineProps<{
    columns: AdminColumn[]
    items: T[]
    loading?: boolean
    error?: string
    emptyMessage?: string
    emptyActionLabel?: string
    minWidth?: string
    fixed?: boolean
    colWidths?: string[]
    rowClass?: string
    forceTable?: boolean
  }>(),
  {
    loading: false,
    error: '',
    emptyMessage: 'No records found',
    emptyActionLabel: '',
    minWidth: 'min-w-full',
    fixed: false,
    colWidths: () => [],
    rowClass: '',
    forceTable: false,
  },
)

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'emptyAction'): void
}>()

const slots = useSlots()
const hasMobileSlot = Boolean(slots.mobile)
</script>

<template>
  <div class="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
    <LoadingTable v-if="loading" />

    <EmptyTable
      v-else-if="error"
      :message="error"
      :action-label="emptyActionLabel || 'Retry'"
      @action="emit('retry')"
    />

    <EmptyTable
      v-else-if="items.length === 0"
      :message="emptyMessage"
      :action-label="emptyActionLabel"
      @action="emit('emptyAction')"
    />

    <template v-else>
      <!-- Fixed-layout table (forces the table on every breakpoint with horizontal scroll) -->
      <div v-if="forceTable" class="w-full overflow-x-auto">
        <table class="w-full text-left text-sm" :class="[minWidth, { 'table-fixed': fixed }]">
          <colgroup v-if="colWidths.length">
            <col v-for="(width, index) in colWidths" :key="index" :style="{ width }" />
          </colgroup>
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40">
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                :class="column.className ?? ''"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="transition hover:bg-gray-50/60 dark:hover:bg-gray-800/30"
              :class="rowClass"
            >
              <slot name="row" :item="item" :index="index" />
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="w-full text-left text-sm" :class="minWidth">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40">
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                :class="column.className ?? ''"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="transition hover:bg-gray-50/60 dark:hover:bg-gray-800/30"
              :class="rowClass"
            >
              <slot name="row" :item="item" :index="index" />
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!forceTable && hasMobileSlot" class="grid grid-cols-1 gap-4 p-4 md:hidden">
        <template v-for="(item, index) in items" :key="index">
          <slot name="mobile" :item="item" :index="index" />
        </template>
      </div>
    </template>
  </div>
</template>