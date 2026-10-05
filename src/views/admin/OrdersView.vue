<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCcw, RefreshCw } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getAdminOrders } from '../../api/orders'
import OrderTable from '../../components/admin/OrderTable.vue'
import SearchInput from '../../components/admin/SearchInput.vue'
import FilterSelect from '../../components/admin/FilterSelect.vue'
import Pagination from '../../components/Pagination.vue'
import type { AdminOrder } from '../../types'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const orders = ref<AdminOrder[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const lastPage = ref(1)

const statusOptions = ['pending', 'processing', 'completed', 'cancelled']

const filters = reactive<{
  search: string
  status: string
  date: string
  sort: string
}>({
  search: '',
  status: '',
  date: '',
  sort: 'latest',
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await getAdminOrders({
      search: filters.search || undefined,
      status: (filters.status as 'pending' | 'processing' | 'completed' | 'cancelled' | undefined) || undefined,
      date: filters.date || undefined,
      sort: (filters.sort as 'latest' | 'oldest' | 'amount_desc' | 'amount_asc'),
      page: page.value,
      per_page: perPage.value,
    })
    orders.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    page.value = result.page
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
    orders.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch([filters, perPage], () => {
  page.value = 1
  load()
})

onMounted(load)

const hasFilters = computed(
  () => !!(filters.search || filters.status || filters.date || filters.sort !== 'latest'),
)

function clearFilters() {
  filters.search = ''
  filters.status = ''
  filters.date = ''
  filters.sort = 'latest'
  page.value = 1
  load()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('orders') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('itemsCount', { n: total }) }}
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-indigo-900/30"
        :disabled="loading"
        @click="load"
      >
        <RefreshCw class="h-4 w-4" />
        {{ $t('refresh') }}
      </button>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
        <SearchInput
          v-model="filters.search"
          :placeholder="t('searchOrders')"
          :aria-label="t('searchOrders')"
        />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-auto xl:flex-none">
          <FilterSelect
            v-model="filters.status"
            :options="statusOptions.map((value) => ({ value, label: t(value) }))"
            :all-label="t('allStatuses')"
            :aria-label="t('status')"
          />
          <label class="relative min-w-0">
            <span class="sr-only">{{ t('date') }}</span>
            <input
              type="date"
              :value="filters.date"
              class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @input="filters.date = ($event.target as HTMLInputElement).value"
            />
          </label>
          <FilterSelect
            v-model="filters.sort"
            :options="[
              { value: 'oldest', label: t('oldestFirst') },
              { value: 'amount_desc', label: t('amountHighLow') },
              { value: 'amount_asc', label: t('amountLowHigh') },
            ]"
            :all-label="t('newestFirst')"
            :aria-label="t('sortBy')"
          />
        </div>
        <button
          v-if="hasFilters"
          type="button"
          class="flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          @click="clearFilters"
        >
          <RotateCcw class="h-4 w-4" />
          {{ $t('clear') }}
        </button>
      </div>
    </div>

    <OrderTable
      :orders="orders"
      :loading="loading"
      :error="error"
      @retry="load"
      @view="router.push(`/admin/orders/${$event.id}`)"
    />

    <Pagination
      :current-page="page"
      :total-pages="lastPage"
      :total="total"
      :per-page="perPage"
      :summary-text="t('showingSummary')"
      @update:page="page = $event; load()"
      @update:per-page="perPage = $event"
    />
  </div>
</template>