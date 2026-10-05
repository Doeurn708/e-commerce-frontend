<script setup lang="ts">
import { imageUrl, onImageError } from '../utils/image'

interface SummaryLine {
  name: string
  qty: number
  price: number
  /**
   * Raw `image` value from the product record. Optional so the admin order
   * screens can reuse this component without carrying product images around;
   * imageUrl() already falls back to the placeholder for a missing file.
   */
  image?: string | null
}

const props = withDefaults(
  defineProps<{
    items?: SummaryLine[]
    subtotal: number
    shipping: number
    discount?: number
    total: number
    currency?: string
  }>(),
  { items: undefined, discount: 0, currency: '$' },
)

function money(value: number): string {
  return `${value < 0 ? '-' : ''}${props.currency}${Math.abs(value).toFixed(2)}`
}
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">{{ $t('orderSummary') }}</h2>

    <div v-if="items && items.length" class="max-h-64 space-y-3 overflow-y-auto">
      <div
        v-for="(item, index) in items"
        :key="`${item.name}-${index}`"
        class="flex items-center gap-3 text-sm"
      >
        <img
          :src="imageUrl(item.image)"
          :alt="item.name"
          class="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          loading="lazy"
          @error="onImageError"
        />
        <span class="min-w-0 flex-1">
          <span class="block truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</span>
          <span class="block text-xs text-gray-400">{{ $t('quantity') }}: {{ item.qty }}</span>
        </span>
        <span class="shrink-0 font-medium text-gray-900 dark:text-white">{{ money(item.price * item.qty) }}</span>
      </div>
    </div>

    <dl :class="items && items.length ? 'mt-4 space-y-3 border-t border-gray-200 pt-4 text-sm dark:border-gray-700' : 'space-y-3 text-sm'">
      <div class="flex justify-between">
        <dt class="text-gray-500 dark:text-gray-400">{{ $t('subtotal') }}</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ money(subtotal) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-gray-500 dark:text-gray-400">{{ $t('shipping') }}</dt>
        <dd class="font-medium text-gray-900 dark:text-white">
          {{ shipping === 0 ? $t('free') : money(shipping) }}
        </dd>
      </div>
      <div v-if="discount > 0" class="flex justify-between">
        <dt class="text-gray-500 dark:text-gray-400">{{ $t('discount') }}</dt>
        <dd class="font-medium text-red-500">-{{ money(discount) }}</dd>
      </div>
      <div class="flex justify-between border-t border-gray-200 pt-3 text-base dark:border-gray-700">
        <dt class="font-bold text-gray-900 dark:text-white">{{ $t('total') }}</dt>
        <dd class="font-bold text-indigo-600 dark:text-indigo-400">{{ money(total) }}</dd>
      </div>
    </dl>

    <slot></slot>
  </div>
</template>