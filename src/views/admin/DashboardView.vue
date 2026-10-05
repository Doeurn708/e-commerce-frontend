<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Package,
  Receipt,
  Users,
  Tag,
  TrendingDown,
  TrendingUp,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  TriangleAlert,
  RefreshCw,
} from '@lucide/vue'
import StatusBadge from '../../components/admin/StatusBadge.vue'
import { useI18n } from '../../stores/i18n'
import { formatMoney, formatNumber, formatDateTime } from '../../utils/format'
import { imageUrl, onImageError } from '../../utils/image'
import { getDashboardStats } from '../../api/dashboard'
import type { DashboardData } from '../../types'

const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const data = ref<DashboardData>({
  stats: {
    products_total: 0,
    categories_total: 0,
    orders_total: 0,
    customers_total: 0,
    users_total: 0,
    revenue_total: 0,
    pending_orders: 0,
    low_stock_total: 0,
  },
  recent_orders: [],
  recent_products: [],
  low_stock_products: [],
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await getDashboardStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const todayLabel = new Date().toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const stats = computed(() => [
  {
    label: t('productsTitle'),
    value: formatNumber(data.value.stats.products_total),
    trend: '+12%',
    up: true,
    icon: Package,
    iconClass:
      'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/40 dark:text-indigo-300 dark:group-hover:bg-indigo-600',
  },
  {
    label: t('categories'),
    value: formatNumber(data.value.stats.categories_total),
    trend: '+5%',
    up: true,
    icon: Tag,
    iconClass:
      'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-900/40 dark:text-violet-300 dark:group-hover:bg-violet-600',
  },
  {
    label: t('orders'),
    value: formatNumber(data.value.stats.orders_total),
    trend: '+8%',
    up: true,
    icon: Receipt,
    iconClass:
      'bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white dark:bg-sky-900/40 dark:text-sky-300 dark:group-hover:bg-sky-600',
  },
  {
    label: t('customers'),
    value: formatNumber(data.value.stats.customers_total),
    trend: '+5%',
    up: true,
    icon: Users,
    iconClass:
      'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300 dark:group-hover:bg-emerald-600',
  },
  {
    label: t('revenue'),
    value: formatMoney(data.value.stats.revenue_total),
    trend: '+4%',
    up: true,
    icon: CircleDollarSign,
    iconClass:
      'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-900/40 dark:text-amber-300 dark:group-hover:bg-amber-600',
  },
  {
    label: t('pendingOrders'),
    value: formatNumber(data.value.stats.pending_orders),
    trend: data.value.stats.pending_orders > 0 ? '+3%' : '0%',
    up: true,
    icon: ClipboardList,
    iconClass:
      'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white dark:bg-rose-900/40 dark:text-rose-300 dark:group-hover:bg-rose-600',
  },
])

const revenueLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const revenueValues = [42, 68, 55, 82, 60, 92, 76]
const revenueTotal = computed(() => revenueValues.reduce((a, b) => a + b, 0))

const chart = computed(() => {
  const max = Math.max(...revenueValues)
  const min = Math.min(...revenueValues)
  const range = max - min || 1
  const points = revenueValues.map((v, i) => ({
    x: (i / (revenueValues.length - 1)) * 100,
    y: 38 - ((v - min) / range) * 32,
    value: v,
  }))
  const line = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const area = `M0 40 L${points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L')} L100 40 Z`
  return { points, line, area }
})

const weeklySales = [
  { day: 'Mon', value: 42 },
  { day: 'Tue', value: 68 },
  { day: 'Wed', value: 55 },
  { day: 'Thu', value: 78 },
  { day: 'Fri', value: 60 },
  { day: 'Sat', value: 92 },
  { day: 'Sun', value: 70 },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('dashboard') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your store performance
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
        >
          <Calendar class="h-3.5 w-3.5" />
          {{ todayLabel }}
        </span>
        <button
          type="button"
          class="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-indigo-900/30"
          :disabled="loading"
          @click="load"
        >
          <RefreshCw class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('refresh') }}
        </button>
      </div>
    </div>

    <div
      class="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-6"
      role="status"
      aria-live="polite"
    >
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="group flex h-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition" :class="stat.iconClass">
            <component :is="stat.icon" class="h-5 w-5" />
          </div>
          <span
            class="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
            :class="stat.up ? 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300'"
          >
            <TrendingUp v-if="stat.up" class="h-3 w-3" />
            <TrendingDown v-else class="h-3 w-3" />
            {{ stat.trend }}
          </span>
        </div>
        <p class="mt-4 break-words text-2xl font-extrabold text-gray-900 dark:text-white">
          {{ stat.value }}
        </p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div
        class="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 lg:col-span-2"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
            <p class="mt-0.5 text-xs text-gray-400">Weekly revenue trend</p>
          </div>
          <div class="flex items-center gap-1 rounded-full bg-gray-100 p-1 text-xs font-medium dark:bg-gray-800">
            <button
              type="button"
              class="rounded-full bg-white px-3 py-1.5 font-semibold text-indigo-600 shadow-sm dark:bg-gray-900 dark:text-indigo-300"
            >
              7d
            </button>
            <button type="button" class="rounded-full px-3 py-1.5 text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              30d
            </button>
            <button type="button" class="rounded-full px-3 py-1.5 text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              90d
            </button>
          </div>
        </div>

        <p class="text-2xl font-extrabold text-gray-900 dark:text-white">
          {{ formatMoney(revenueTotal * 100) }}
          <span class="ml-2 text-sm font-semibold text-green-500">▲ 24.3%</span>
        </p>

        <div class="relative mt-6">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="h-44 w-full">
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path :d="chart.area" fill="url(#areaFill)" />
            <polyline
              :points="chart.line"
              fill="none"
              stroke="#6366f1"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
            <g v-for="p in chart.points" :key="p.x">
              <circle :cx="p.x" :cy="p.y" r="1.6" fill="#6366f1" />
              <circle :cx="p.x" :cy="p.y" r="0.6" fill="#fff" />
            </g>
          </svg>
          <div class="mt-2 flex justify-between text-[10px] font-medium text-gray-400">
            <span v-for="label in revenueLabels" :key="label">{{ label }}</span>
          </div>
        </div>
      </div>

      <div class="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white">Sales by Day</h2>
            <p class="mt-0.5 text-xs text-gray-400">Last 7 days</p>
          </div>
        </div>
        <div class="flex h-56 items-end justify-between gap-2.5">
          <div
            v-for="day in weeklySales"
            :key="day.day"
            class="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span class="text-[10px] font-semibold text-gray-400">{{ day.value }}</span>
            <div
              class="w-full rounded-t-lg bg-indigo-100 transition group-hover:bg-indigo-500 dark:bg-indigo-900/50 dark:group-hover:bg-indigo-500"
              :style="{ height: day.value + '%' }"
              :title="'$' + day.value * 10"
            ></div>
            <span class="text-[10px] text-gray-500 dark:text-gray-400">{{ day.day }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div
        class="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <TriangleAlert class="h-4 w-4 text-amber-500" />
            {{ $t('lowStock') }}
            <span class="ml-auto text-sm font-semibold text-gray-400">
              {{ data.stats.low_stock_total }}
            </span>
          </h2>
        </div>
        <div v-if="loading" class="space-y-3 p-6">
          <div v-for="i in 3" :key="i" class="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
        </div>
        <div v-else-if="data.low_stock_products.length === 0" class="px-6 py-10 text-center text-sm text-gray-400">
          No low stock products
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="product in data.low_stock_products" :key="product.id" class="flex items-center gap-3 px-6 py-3">
            <img
              v-if="product.image"
              :src="imageUrl(product.image)"
              :alt="product.name"
              class="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
              loading="lazy"
              @error="onImageError"
            />
            <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800">
              —
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</p>
              <p class="text-xs text-gray-400">
                {{ formatMoney(product.price) }} · {{ product.category?.name }}
              </p>
            </div>
            <span
              class="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300"
            >
              {{ product.stock }} left
            </span>
          </div>
        </div>
      </div>

      <div
        class="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 class="font-bold text-gray-900 dark:text-white">{{ $t('recentProducts') }}</h2>
          <RouterLink to="/admin/products" class="text-sm font-medium text-indigo-600 hover:underline">
            {{ $t('viewAll') }}
          </RouterLink>
        </div>
        <div v-if="loading" class="space-y-3 p-6">
          <div v-for="i in 3" :key="i" class="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
        </div>
        <div v-else-if="data.recent_products.length === 0" class="px-6 py-10 text-center text-sm text-gray-400">
          No recent products
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="product in data.recent_products" :key="product.id" class="flex items-center gap-3 px-6 py-3">
            <img
              v-if="product.image"
              :src="imageUrl(product.image)"
              :alt="product.name"
              class="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
              loading="lazy"
              @error="onImageError"
            />
            <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800">
              —
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</p>
              <p class="text-xs text-gray-400">{{ product.category?.name }}</p>
            </div>
            <span class="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
              {{ formatMoney(product.price) }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:col-span-3 xl:col-span-1"
      >
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 class="font-bold text-gray-900 dark:text-white">{{ $t('recentOrders') }}</h2>
          <RouterLink to="/admin/orders" class="text-sm font-medium text-indigo-600 hover:underline">
            {{ $t('viewAll') }}
          </RouterLink>
        </div>
        <div v-if="loading" class="space-y-3 p-6">
          <div v-for="i in 3" :key="i" class="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
        </div>
        <div v-else-if="data.recent_orders.length === 0" class="px-6 py-10 text-center text-sm text-gray-400">
          No recent orders
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <RouterLink
            v-for="order in data.recent_orders"
            :key="order.id"
            :to="`/admin/orders/${order.id}`"
            class="flex items-center gap-3 px-6 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">#{{ order.id }}</p>
              <p class="truncate text-xs text-gray-400">
                {{ order.user?.name ?? `#${order.user_id}` }} · {{ formatDateTime(order.created_at) }}
              </p>
            </div>
            <span class="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
              {{ formatMoney(order.total_price) }}
            </span>
            <StatusBadge :value="order.status" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>