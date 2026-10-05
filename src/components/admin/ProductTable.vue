<script setup lang="ts">
import AdminTable, { type AdminColumn } from './AdminTable.vue'
import StatusBadge from './StatusBadge.vue'
import { Eye, Pencil, Trash2 } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { formatMoney, formatDate, productStatus } from '../../utils/format'
import { imageUrl, onImageError } from '../../utils/image'
import type { Product } from '../../types'

const props = withDefaults(
  defineProps<{
    products: Product[]
    loading?: boolean
    error?: string
    emptyMessage?: string
    emptyActionLabel?: string
  }>(),
  { loading: false, error: '', emptyMessage: '', emptyActionLabel: '' },
)

const emit = defineEmits<{
  (e: 'view', product: Product): void
  (e: 'edit', product: Product): void
  (e: 'delete', product: Product): void
  (e: 'retry'): void
  (e: 'emptyAction'): void
}>()

const { t } = useI18n()

// Explicit column widths (sum = 100%). Header and body share the same grid.
const COL_WIDTHS = ['5%', '7%', '15%', '10%', '18%', '8%', '7%', '9%', '8%', '13%']

const columns: AdminColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'image', label: t('image'), className: 'text-center' },
  { key: 'product', label: t('product') },
  { key: 'category', label: t('categories') },
  { key: 'description', label: t('description'), className: 'hidden lg:table-cell' },
  { key: 'price', label: t('price') },
  { key: 'stock', label: t('stockHeader'), className: 'text-center' },
  { key: 'status', label: t('status'), className: 'text-center' },
  { key: 'created', label: t('created'), className: 'text-center' },
  { key: 'actions', label: t('actions'), className: 'text-center' },
]
</script>

<template>
  <AdminTable
    :columns="columns"
    :items="products"
    :loading="loading"
    :error="error"
    :empty-message="emptyMessage || t('noProductsYet')"
    :empty-action-label="emptyActionLabel"
    fixed
    force-table
    :min-width="'min-w-[1400px]'"
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

      <!-- IMAGE -->
      <td class="px-4 py-3 text-center align-middle">
        <img
          v-if="item.image"
          :src="imageUrl(item.image)"
          :alt="item.name"
          class="h-16 w-16 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          loading="lazy"
          @error="onImageError"
        />
        <div
          v-else
          class="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800"
        >
          —
        </div>
      </td>

      <!-- PRODUCT -->
      <td class="px-4 py-3 align-middle">
        <div class="min-w-0">
          <div class="truncate font-semibold text-gray-900 dark:text-white">{{ item.name }}</div>
          <div class="truncate text-sm text-gray-400">{{ item.slug }}</div>
        </div>
      </td>

      <!-- CATEGORIES -->
      <td class="truncate whitespace-nowrap px-4 py-3 align-middle text-gray-600 dark:text-gray-300">
        {{ item.category?.name ?? '—' }}
      </td>

      <!-- DESCRIPTION -->
      <td class="hidden px-4 py-3 align-middle lg:table-cell">
        <div class="truncate text-gray-500 dark:text-gray-400">
          {{ item.description || '—' }}
        </div>
      </td>

      <!-- PRICE -->
      <td class="whitespace-nowrap px-4 py-3 align-middle font-semibold text-gray-900 dark:text-white">
        {{ formatMoney(item.price) }}
      </td>

      <!-- STOCK -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle text-gray-600 dark:text-gray-300">
        {{ item.stock }}
      </td>

      <!-- STATUS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle">
        <StatusBadge :value="productStatus(item.stock)" :label="t(productStatus(item.stock))" />
      </td>

      <!-- CREATED -->
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
            class="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
            :title="t('delete')"
            :aria-label="t('delete')"
            @click="emit('delete', item)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </td>
    </template>
  </AdminTable>
</template>