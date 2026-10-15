<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Package, ArrowLeft, RotateCcw, XCircle } from '@lucide/vue'
import OrderStatusBadge from '../components/OrderStatusBadge.vue'
import EmptyState from '../components/EmptyState.vue'
import { getOrder, cancelOrder } from '../api/orders'
import { useCart } from '../stores/cart'
import { useAuth } from '../stores/auth'
import { toastSuccess, toastError } from '../stores/toast'
import { useI18n } from '../stores/i18n'
import { imageUrl, onImageError } from '../utils/image'
import type { Order } from '../types'

const route = useRoute()
const router = useRouter()
const { addItem } = useCart()
const { currentUser } = useAuth()
const { t } = useI18n()

const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref('')
const cancelling = ref(false)

const cancelled = computed(() => order.value?.status === 'cancelled')
// OrderController::cancel() rejects anything that is not still pending.
const canCancel = computed(() => order.value?.status === 'pending')

const steps = ['pending', 'processing', 'completed']

function stepIndex(): number {
  const status = order.value?.status ?? 'pending'
  if (status === 'cancelled') return -1
  return steps.indexOf(status)
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    order.value = await getOrder(route.params.id as string)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load order'
  } finally {
    loading.value = false
  }
})

function buyAgain() {
  if (!order.value) return
  // Pass the product when the order response included it so the cart is filled
  // straight away; otherwise the id is rehydrated on the cart page.
  order.value.items.forEach((item) => addItem(item.product ?? item.product_id, item.quantity))
  toastSuccess(t('addedToCart', { name: order.value.items.length + ' items' }))
}

async function cancel() {
  if (!order.value) return
  cancelling.value = true
  try {
    order.value = await cancelOrder(order.value.id)
    toastSuccess(t('orderCancelled'))
  } catch (e) {
    toastError(e instanceof Error ? e.message : t('operationFailed'))
  } finally {
    cancelling.value = false
  }
}

const summaryRow = 'flex justify-between text-sm'
</script>

<template>
  <div>
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600 dark:text-gray-400"
      @click="router.push('/account/orders')"
    >
      <ArrowLeft class="h-4 w-4" />
      {{ $t('backToOrders') }}
    </button>

    <div v-if="loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
    </div>

    <EmptyState
      v-else-if="error"
      :title="$t('orderNotFound')"
      :description="error"
      :action-label="$t('backToOrders')"
      @action="router.push('/account/orders')"
    />

    <div v-else-if="order" class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Order #{{ order.id }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(order.created_at) }}</p>
        </div>
        <OrderStatusBadge :status="order.status" />
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-6 text-lg font-bold text-gray-900 dark:text-white">{{ $t('orderProgress') }}</h2>
        <div v-if="!cancelled" class="flex items-center">
          <template v-for="(step, i) in steps" :key="step">
            <div class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                :class="i <= stepIndex() ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'"
              >
                <svg v-if="i < stepIndex()" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span
                class="hidden text-sm font-medium sm:block"
                :class="i <= stepIndex() ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
              >
                {{ $t(step) }}
              </span>
            </div>
            <span
              v-if="i < steps.length - 1"
              class="mx-3 h-1 flex-1 rounded"
              :class="i < stepIndex() ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'"
            ></span>
          </template>
        </div>
        <div v-else class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {{ $t('orderWasCancelled') }}
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 lg:col-span-2">
          <h2 class="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Package class="h-5 w-5 text-indigo-600" />
            {{ $t('orderItems') }}
          </h2>
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 py-4">
              <img
                :src="imageUrl(item.product?.image)"
                :alt="item.product?.name ?? 'Product'"
                class="h-16 w-16 rounded-xl object-cover"
                @error="onImageError"
              />
              <div class="min-w-0 flex-1">
                <RouterLink
                  :to="`/product/${item.product?.slug ?? item.product_id}`"
                  class="line-clamp-1 font-semibold text-gray-800 hover:text-indigo-600 dark:text-gray-100"
                >
                  {{ item.product?.name ?? `Product #${item.product_id}` }}
                </RouterLink>
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  ${{ item.price.toFixed(2) }} × {{ item.quantity }}
                </p>
              </div>
              <span class="font-bold text-gray-900 dark:text-white">
                ${{ (item.price * item.quantity).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">{{ $t('shippingInformation') }}</h2>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">{{ $t('fullName') }}</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ currentUser?.name ?? '-' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">{{ $t('phone') }}</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ order.phone }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="shrink-0 text-gray-500 dark:text-gray-400">{{ $t('address') }}</dt>
                <!--
                  The checkout map is coordinates-only, so shipping_address is
                  normally absent. Join only the parts that exist instead of
                  interpolating every field, which would render ", ," for an
                  order with no address at all.
                -->
                <dd class="text-right font-medium text-gray-900 dark:text-white">
                  <span
                    v-if="[
                      order.shipping_address,
                      order.city,
                      order.province,
                      order.postal_code,
                    ].filter(Boolean).length"
                    >{{
                      [
                        order.shipping_address,
                        order.city,
                        order.province,
                        order.postal_code,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    }}</span
                  >
                  <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                </dd>
              </div>
              <!--
                The delivery location actually used. Shown because it is now the
                only thing a courier can navigate to.
              -->
              <div
                v-if="order.latitude != null && order.longitude != null"
                class="flex justify-between gap-3"
              >
                <dt class="shrink-0 text-gray-500 dark:text-gray-400">{{ $t('deliveryLocation') }}</dt>
                <dd class="text-right font-medium tabular-nums text-gray-900 dark:text-white">
                  {{ order.latitude.toFixed(7) }}, {{ order.longitude.toFixed(7) }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">{{ $t('paymentInformation') }}</h2>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('paymentMethod') }}</span>
              <span class="font-medium capitalize text-gray-900 dark:text-white">
                {{ order.payment_method === 'cod' ? $t('cashOnDelivery') : $t('onlinePayment') }}
              </span>
            </div>
            <div class="mt-2.5 flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('paymentStatus') }}</span>
              <OrderStatusBadge :status="order.payment_status" type="payment" />
            </div>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">{{ $t('orderSummary') }}</h2>
            <dl class="space-y-2.5">
              <div :class="summaryRow">
                <dt class="text-gray-500 dark:text-gray-400">{{ $t('subtotal') }}</dt>
                <dd class="font-medium text-gray-900 dark:text-white">${{ order.subtotal.toFixed(2) }}</dd>
              </div>
              <div :class="summaryRow">
                <dt class="text-gray-500 dark:text-gray-400">{{ $t('shipping') }}</dt>
                <dd class="font-medium text-gray-900 dark:text-white">
                  {{ order.shipping === 0 ? $t('free') : '$' + order.shipping.toFixed(2) }}
                </dd>
              </div>
              <div v-if="order.discount > 0" :class="summaryRow">
                <dt class="text-gray-500 dark:text-gray-400">{{ $t('discount') }}</dt>
                <dd class="font-medium text-red-500">-${{ order.discount.toFixed(2) }}</dd>
              </div>
              <div :class="[summaryRow, 'border-t border-gray-200 pt-3 dark:border-gray-700']">
                <dt class="font-bold text-gray-900 dark:text-white">{{ $t('total') }}</dt>
                <dd class="font-bold text-indigo-600 dark:text-indigo-400">${{ order.total_price.toFixed(2) }}</dd>
              </div>
            </dl>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="flex flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              @click="buyAgain"
            >
              <RotateCcw class="h-4 w-4" />
              {{ $t('buyAgain') }}
            </button>
            <button
              v-if="canCancel"
              type="button"
              :disabled="cancelling"
              class="flex flex-1 items-center justify-center gap-2 rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/20"
              @click="cancel"
            >
              <XCircle class="h-4 w-4" />
              {{ cancelling ? t('cancelling') : t('cancelOrder') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>