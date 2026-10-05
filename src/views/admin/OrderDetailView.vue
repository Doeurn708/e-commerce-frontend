<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save, RefreshCw } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getAdminOrder, updateAdminOrderStatus } from '../../api/orders'
import StatusBadge from '../../components/admin/StatusBadge.vue'
import ConfirmModal from '../../components/admin/ConfirmModal.vue'
import { formatMoney, formatDateTime } from '../../utils/format'
import { imageUrl, onImageError } from '../../utils/image'
import type { AdminOrder } from '../../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const orderId = route.params.id as string

const loading = ref(true)
const error = ref('')
const order = ref<AdminOrder | null>(null)

const selectedStatus = ref('')
const saving = ref(false)
const cancelOpen = ref(false)
const cancelLoading = ref(false)

const feedback = ref('')
const feedbackError = ref(false)

const statusOptions = ['pending', 'processing', 'completed', 'cancelled']

function showFeedback(message: string, isError = false) {
  feedback.value = message
  feedbackError.value = isError
  setTimeout(() => {
    feedback.value = ''
  }, 3000)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    order.value = await getAdminOrder(orderId)
    selectedStatus.value = order.value.status
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('orderNotFound')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const items = computed(() => order.value?.orderItems ?? order.value?.items ?? [])
const subtotal = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)
const shipping = computed(() => {
  const total = order.value?.total_price ?? 0
  return Math.max(0, total - subtotal.value)
})

const canUpdate = computed(() => {
  const current = order.value?.status
  return current !== 'cancelled' && current !== 'completed'
})

const canCancel = computed(() => {
  const current = order.value?.status
  return current === 'pending' || current === 'processing'
})

async function onUpdateStatus() {
  const status = selectedStatus.value as 'pending' | 'processing' | 'completed' | 'cancelled'
  if (!order.value || !status || status === order.value.status) return
  saving.value = true
  try {
    order.value = await updateAdminOrderStatus(order.value.id, status)
    showFeedback(t('statusUpdatedMsg'))
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    saving.value = false
  }
}

async function onCancelConfirmed() {
  if (!order.value) return
  cancelLoading.value = true
  try {
    order.value = await updateAdminOrderStatus(order.value.id, 'cancelled')
    selectedStatus.value = 'cancelled'
    showFeedback(t('orderCancelledMsg'))
    cancelOpen.value = false
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    cancelLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-4xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <button
          type="button"
          class="mb-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
          @click="router.push('/admin/orders')"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ $t('backToOrders') }}
        </button>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ $t('orderDetails') }} <span class="text-indigo-600">#{{ orderId }}</span>
          </h1>
          <StatusBadge v-if="order" :value="order.status" />
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-indigo-900/30"
        :disabled="loading"
        @click="load"
      >
        <RefreshCw class="h-4 w-4" />
        {{ $t('refresh') }}
      </button>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl border px-4 py-3 text-sm font-medium"
      :class="feedbackError
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'"
    >
      {{ feedback }}
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="i in 2" :key="i" class="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
      </div>
      <div class="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
    </div>

    <div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
      {{ error }}
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ t('orderInformation') }}
          </h2>
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('orderId') }}</dt>
              <dd class="font-semibold text-gray-900 dark:text-white">#{{ order.id }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('status') }}</dt>
              <dd><StatusBadge :value="order.status" /></dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('date') }}</dt>
              <dd class="text-gray-700 dark:text-gray-300">{{ formatDateTime(order.created_at) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('items') }}</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ order.items_count ?? items.length }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('total') }}</dt>
              <dd class="font-bold text-indigo-600 dark:text-indigo-400">{{ formatMoney(order.total_price) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ t('customerInformation') }}
          </h2>
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('customer') }}</dt>
              <dd class="font-semibold text-gray-900 dark:text-white">
                {{ order.user?.name ?? `#${order.user_id}` }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('email') }}</dt>
              <dd class="max-w-[180px] truncate text-gray-700 dark:text-gray-300">{{ order.user?.email ?? '—' }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('phone') }}</dt>
              <dd class="text-gray-700 dark:text-gray-300">{{ order.phone ?? '—' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-3">
              <dt class="shrink-0 text-gray-500 dark:text-gray-400">{{ t('address') }}</dt>
              <dd class="text-right text-gray-700 dark:text-gray-300">{{ order.shipping_address ?? '—' }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ t('paymentInformation') }}
        </h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <StatusBadge :value="order.payment?.payment_status ?? 'unpaid'" />
          <span
            class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {{ order.payment?.payment_method ?? t('paymentMethod') }} ·
            {{ order.payment?.id ? formatMoney(order.payment.amount ?? order.total_price) : formatMoney(order.total_price) }}
          </span>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 class="font-bold text-gray-900 dark:text-white">{{ t('orderItems') }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-full text-left text-sm">
            <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th class="px-5 py-3">{{ t('product') }}</th>
                <th class="px-5 py-3">{{ t('quantity') }}</th>
                <th class="px-5 py-3 text-right">{{ t('price') }}</th>
                <th class="px-5 py-3 text-right">{{ t('subtotal') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="item in items" :key="item.id">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="item.product?.image"
                      :src="imageUrl(item.product.image)"
                      :alt="item.product?.name"
                      class="h-9 w-9 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                      @error="onImageError"
                    />
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ item.product?.name ?? `#${item.product_id}` }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-300">{{ item.quantity }}</td>
                <td class="px-5 py-3 text-right text-gray-500 dark:text-gray-400">{{ formatMoney(item.price) }}</td>
                <td class="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  {{ formatMoney(item.price * item.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <dl class="ml-auto max-w-xs space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('subtotal') }}</dt>
              <dd class="text-gray-700 dark:text-gray-300">{{ formatMoney(subtotal) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('shipping') }}</dt>
              <dd class="text-gray-700 dark:text-gray-300">{{ shipping === 0 ? t('free') : formatMoney(shipping) }}</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
              <dt class="font-semibold text-gray-900 dark:text-white">{{ t('total') }}</dt>
              <dd class="font-bold text-indigo-600 dark:text-indigo-400">{{ formatMoney(order.total_price) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ t('updateStatus') }}
          </h2>
          <div class="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              v-model="selectedStatus"
              :disabled="!canUpdate"
              class="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 disabled:opacity-50"
            >
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ t(status) }}
              </option>
            </select>
            <button
              type="button"
              class="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              :disabled="saving || !canUpdate || selectedStatus === order.status"
              @click="onUpdateStatus"
            >
              <Save class="h-4 w-4" />
              {{ saving ? t('loading') : t('save') }}
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ t('orderSummary') }}
          </h2>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {{ items.length }} {{ t('orderItems') }}
          </p>
          <button
            type="button"
            class="mt-4 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
            :disabled="!canCancel"
            @click="cancelOpen = true"
          >
            {{ t('cancelOrder') }}
          </button>
        </div>
      </div>

      <ConfirmModal
        :open="cancelOpen"
        :title="t('cancelOrderConfirmTitle')"
        :message="t('cancelOrderConfirmMessage')"
        :confirm-text="t('confirm')"
        :cancel-text="t('cancel')"
        :loading="cancelLoading"
        @confirm="onCancelConfirmed"
        @cancel="cancelOpen = false"
      />
    </template>
  </div>
</template>