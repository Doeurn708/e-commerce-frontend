<script setup lang="ts">
import AdminTable, { type AdminColumn } from './AdminTable.vue'
import { Eye, Pencil, Trash2 } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { formatDate } from '../../utils/format'
import { imageUrl, onImageError } from '../../utils/image'
import type { Category } from '../../types'

const props = withDefaults(
  defineProps<{
    categories: Category[]
    loading?: boolean
    error?: string
    emptyMessage?: string
    emptyActionLabel?: string
  }>(),
  { loading: false, error: '', emptyMessage: '', emptyActionLabel: '' },
)

const emit = defineEmits<{
  (e: 'view', category: Category): void
  (e: 'edit', category: Category): void
  (e: 'delete', category: Category): void
  (e: 'retry'): void
  (e: 'emptyAction'): void
}>()

const { t } = useI18n()

// Explicit column widths (sum = 100%). Header and body share the same grid.
const COL_WIDTHS = ['5%', '10%', '18%', '16%', '20%', '10%', '9%', '12%']

const columns: AdminColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'image', label: t('image'), className: 'text-center' },
  { key: 'name', label: t('name') },
  { key: 'slug', label: t('slug') },
  { key: 'description', label: t('description'), className: 'hidden lg:table-cell' },
  { key: 'products', label: t('productsCount'), className: 'text-center' },
  { key: 'created', label: t('created'), className: 'text-center' },
  { key: 'actions', label: t('actions'), className: 'text-center' },
]
</script>

<template>
  <AdminTable
    :columns="columns"
    :items="categories"
    :loading="loading"
    :error="error"
    :empty-message="emptyMessage || t('noCategoriesYet')"
    :empty-action-label="emptyActionLabel"
    fixed
    force-table
    :min-width="'min-w-[1100px]'"
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
          #
        </div>
      </td>

      <!-- NAME -->
      <td class="px-4 py-3 align-middle">
        <div class="min-w-0">
          <div class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</div>
        </div>
      </td>

      <!-- SLUG -->
      <td class="px-4 py-3 align-middle">
        <div class="truncate text-gray-500 dark:text-gray-400">{{ item.slug }}</div>
      </td>

      <!-- DESCRIPTION -->
      <td class="hidden px-4 py-3 align-middle lg:table-cell">
        <div class="truncate text-gray-500 dark:text-gray-400">
          {{ item.description || '—' }}
        </div>
      </td>

      <!-- PRODUCTS -->
      <td class="whitespace-nowrap px-4 py-3 text-center align-middle text-gray-600 dark:text-gray-300">
        {{ item.products_count ?? item.products?.length ?? 0 }}
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