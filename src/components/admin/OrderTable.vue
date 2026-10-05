<script setup lang="ts">
import AdminTable, { type AdminColumn } from './AdminTable.vue'
import StatusBadge from './StatusBadge.vue'
import { Eye } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { formatMoney, formatDateTime } from '../../utils/format'
import type { AdminOrder } from '../../types'

const props = withDefaults(
  defineProps<{
    orders: AdminOrder[]
    loading?: boolean
    error?: string
    emptyMessage?: string
    emptyActionLabel?: string
  }>(),
  { loading: false, error: '', emptyMessage: '', emptyActionLabel: '' },
)

const emit = defineEmits<{
  (e: 'view', order: AdminOrder): void
  (e: 'retry'): void
  (e: 'emptyAction'): void
}>()

const { t } = useI18n()

// Explicit column widths (sum = 100%). Header and body share the same grid.
const COL_WIDTHS = ['8%', '19%', '11%', '7%', '12%', '12%', '10%', '11%', '10%']

const columns: AdminColumn[] = [
  { key: 'orderId', label: t('orderId') },
  { key: 'customer', label: t('customer') },
  { key: 'phone', label: t('phone'), className: 'hidden lg:table-cell' },
  { key: 'items', label: t('items'), className: 'text-center' },
  { key: 'total', label: t('total') },
  { key: 'payment', label: t('payment'), className: 'hidden lg:table-cell text-center' },
  { key: 'status', label: t('status'), className: 'text-center' },
  { key: 'date', label: t('date'), className: 'text-center' },
  { key: 'actions', label: t('actions'), className: 'text-center' },
]
</script>

<template>
  <AdminTable
    :columns="columns"
    :items="orders"
    :loading="loading"
    :error="error"
    :empty-message="emptyMessage || t('noOrders')"
    :empty-action-label="emptyActionLabel"
    fixed
    force-table
    :min-width="'min-w-[1250px]'"
    :col-widths="COL_WIDTHS"
    row-class="h-[80px]"
    @retry="emit('retry')"
    @empty-action="emit('emptyAction')"
  >
    <template #row="{ item }">
      <!-- ORDER ID -->
      <td class="whitespace-nowrap px-4 py-3 align-middle font-medium text-gray-900 dark:text-white">
        #{{ item.id }}
      </td>

      <!-- CUSTOMER -->
      <td class="px-4 py-3 align-middle">
        <div class="min-w-0">
          <p class="truncate text-gray-700 dark:text-gray-200">{{ item.user?.name ?? `#${item.user_id}` }}</p>
          <p class="truncate text-xs text-gray-400">{{ item.user?.email }}</p>
        </div>
      </td>

      <!-- PHONE -->
      <td class="hidden whitespace-nowrap px-4 py-3 align-middle text-gray-500 dark:text-gray-400 lg:table-cell">
        {{ item.phone || '—' }}
      </td>

      <!-- ITEMS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle text-gray-600 dark:text-gray-300">
        {{ item.items_count ?? 0 }}
      </td>

      <!-- TOTAL -->
      <td class="whitespace-nowrap px-4 py-3 align-middle font-semibold text-gray-900 dark:text-white">
        {{ formatMoney(item.total_price) }}
      </td>

      <!-- PAYMENT -->
      <td class="hidden whitespace-nowrap px-4 py-3 text-center align-middle lg:table-cell">
        <StatusBadge :value="item.payment?.payment_status ?? 'unpaid'" />
      </td>

      <!-- STATUS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle">
        <StatusBadge :value="item.status" />
      </td>

      <!-- DATE -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle text-gray-500 dark:text-gray-400">
        {{ formatDateTime(item.created_at) }}
      </td>

      <!-- ACTIONS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle">
        <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <button
            type="button"
            class="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
            :title="t('view')"
            :aria-label="t('view')"
            @click="emit('view', item)"
          >
            <Eye class="h-4 w-4" />
          </button>
        </div>
      </td>
    </template>
  </AdminTable>
</template>