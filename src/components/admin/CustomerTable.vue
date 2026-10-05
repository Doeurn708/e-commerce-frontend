<script setup lang="ts">
import AdminTable, { type AdminColumn } from './AdminTable.vue'
import StatusBadge from './StatusBadge.vue'
import { Eye, Pencil } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { formatMoney, formatDate, initials } from '../../utils/format'
import type { Customer } from '../../types'

const props = withDefaults(
  defineProps<{
    customers: Customer[]
    loading?: boolean
    error?: string
    emptyMessage?: string
    emptyActionLabel?: string
  }>(),
  { loading: false, error: '', emptyMessage: '', emptyActionLabel: '' },
)

const emit = defineEmits<{
  (e: 'view', customer: Customer): void
  (e: 'edit', customer: Customer): void
  (e: 'orders', customer: Customer): void
  (e: 'toggle', customer: Customer): void
  (e: 'retry'): void
  (e: 'emptyAction'): void
}>()

const { t } = useI18n()

// Explicit column widths (sum = 100%). Header and body share the same grid.
const COL_WIDTHS = ['4%', '19%', '16%', '11%', '8%', '11%', '10%', '9%', '12%']

const columns: AdminColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: t('customer') },
  { key: 'email', label: t('email'), className: 'hidden lg:table-cell' },
  { key: 'phone', label: t('phone'), className: 'hidden xl:table-cell' },
  { key: 'orders', label: t('ordersCount'), className: 'text-center' },
  { key: 'spent', label: t('totalSpent') },
  { key: 'status', label: t('accountStatus'), className: 'text-center' },
  { key: 'registered', label: t('registered'), className: 'text-center' },
  { key: 'actions', label: t('actions'), className: 'text-center' },
]

function statusKey(customer: Customer): string {
  return customer.is_active ? 'active' : 'suspended'
}
</script>

<template>
  <AdminTable
    :columns="columns"
    :items="customers"
    :loading="loading"
    :error="error"
    :empty-message="emptyMessage || t('noUsersYet')"
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
      <!-- ID -->
      <td class="whitespace-nowrap px-4 py-3 align-middle text-gray-500 dark:text-gray-400">
        {{ item.id }}
      </td>

      <!-- CUSTOMER -->
      <td class="px-4 py-3 align-middle">
        <div class="flex items-center gap-3">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white"
          >
            {{ initials(item.name) }}
          </span>
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            <p class="truncate text-xs text-gray-400 capitalize">{{ item.role ?? 'customer' }}</p>
          </div>
        </div>
      </td>

      <!-- EMAIL -->
      <td class="hidden px-4 py-3 align-middle lg:table-cell">
        <div class="truncate text-gray-500 dark:text-gray-400">{{ item.email }}</div>
      </td>

      <!-- PHONE -->
      <td class="hidden whitespace-nowrap px-4 py-3 align-middle text-gray-500 dark:text-gray-400 xl:table-cell">
        {{ item.phone || '—' }}
      </td>

      <!-- ORDERS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle text-gray-600 dark:text-gray-300">
        {{ item.orders_count ?? 0 }}
      </td>

      <!-- SPENT -->
      <td class="whitespace-nowrap px-4 py-3 align-middle font-semibold text-gray-900 dark:text-white">
        {{ formatMoney(item.total_spent) }}
      </td>

      <!-- STATUS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle">
        <StatusBadge :value="statusKey(item)" :label="item.is_active ? t('active') : t('suspended')" />
      </td>

      <!-- REGISTERED -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle text-gray-500 dark:text-gray-400">
        {{ formatDate(item.created_at) }}
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
          <button
            type="button"
            class="rounded-lg p-2 text-gray-400 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30"
            :title="t('edit')"
            :aria-label="t('edit')"
            @click="emit('edit', item)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
            :class="item.is_active
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'"
            :title="item.is_active ? t('disableAccount') : t('enableAccount')"
            @click="emit('toggle', item)"
          >
            {{ item.is_active ? t('disableAccount') : t('enableAccount') }}
          </button>
        </div>
      </td>
    </template>
  </AdminTable>
</template>