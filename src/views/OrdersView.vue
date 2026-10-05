<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Package } from '@lucide/vue'
import OrderCard from '../components/OrderCard.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'
import EmptyState from '../components/EmptyState.vue'
import { getOrders } from '../api/orders'
import type { Order, OrderStatus, Paginated } from '../types'

const orders = ref<Paginated<Order>>({ data: [], total: 0, page: 1, per_page: 6, last_page: 1 })
const loading = ref(false)
const error = ref('')

const search = ref('')
const statusFilter = ref<'all' | OrderStatus>('all')
const sortOrder = ref<'latest' | 'oldest'>('latest')
const currentPage = ref(1)

const statuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled']

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await getOrders({
      page: currentPage.value,
      per_page: 6,
      search: search.value.trim() || undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      sort: sortOrder.value,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

watch(statusFilter, () => {
  currentPage.value = 1
  load()
})
watch(sortOrder, () => {
  currentPage.value = 1
  load()
})
watch(currentPage, load)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    load()
  }, 350)
})

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4">
      <SearchBar v-model="search" placeholder="Search orders..." />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-xs font-semibold transition"
            :class="statusFilter === 'all'
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'"
            @click="statusFilter = 'all'"
          >
            All
          </button>
          <button
            v-for="status in statuses"
            :key="status"
            type="button"
            class="rounded-full border px-4 py-2 text-xs font-semibold capitalize transition"
            :class="statusFilter === status
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'"
            @click="statusFilter = status"
          >
            {{ $t(status) }}
          </button>
        </div>

        <select
          v-model="sortOrder"
          class="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="latest">{{ $t('newestFirst') }}</option>
          <option value="oldest">{{ $t('oldestFirst') }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
    </div>

    <EmptyState
      v-else-if="error"
      :title="$t('loadFailed')"
      :description="error"
      :action-label="$t('tryAgain')"
      @action="load"
    />

    <div v-else-if="orders.data.length" class="space-y-4">
      <OrderCard v-for="order in orders.data" :key="order.id" :order="order" />
    </div>

    <EmptyState
      v-else
      :icon="Package"
      :title="$t('noOrders')"
      :description="$t('noOrdersMessage')"
      :action-label="$t('startShopping')"
      action-to="/shop"
    />

    <div v-if="!loading && !error && orders.data.length && orders.last_page > 1" class="mt-8">
      <Pagination :current-page="currentPage" :total-pages="orders.last_page" @update:page="currentPage = $event" />
    </div>
  </div>
</template>