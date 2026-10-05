<script setup lang="ts">
import { Package, ChevronRight } from '@lucide/vue'
import type { Order } from '../types'
import OrderStatusBadge from './OrderStatusBadge.vue'

defineProps<{
  order: Order
}>()

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function itemCount(items: Order['items']): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}
</script>

<template>
  <article class="group rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
    <div class="flex flex-wrap items-center justify-between gap-4 p-6">
      <div class="flex items-center gap-4">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
          <Package class="h-6 w-6" />
        </span>
        <div>
          <p class="font-bold text-gray-900 dark:text-white">#{{ order.id }}</p>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(order.created_at) }} · {{ itemCount(order.items) }} {{ $t('items') }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <OrderStatusBadge :status="order.status" />
        <span class="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">${{ order.total_price.toFixed(2) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-800 dark:bg-gray-800/40">
      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
        {{ order.items.length }} {{ $t('orderItems') }}
      </span>
      <RouterLink
        :to="`/account/orders/${order.id}`"
        class="flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-2 dark:text-indigo-400"
      >
        {{ $t('viewDetails') }}
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>
  </article>
</template>