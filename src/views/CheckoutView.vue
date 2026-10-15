<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Lock, QrCode, Banknote } from '@lucide/vue'
import QRCode from 'qrcode'
import OrderSummary from '../components/OrderSummary.vue'
import CheckoutMap from '../components/checkout/CheckoutMap.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCart } from '../stores/cart'
import { useAuth } from '../stores/auth'
import { placeOrder } from '../api/orders'
import { toastSuccess, toastError } from '../stores/toast'
import { useI18n } from '../stores/i18n'
import { effectivePrice } from '../stores/product'
import type { PaymentMethod, SelectedLocation } from '../types'

const router = useRouter()
const { cart, lines, isEmpty, subtotal, total, rehydrate, clear } = useCart()
const { currentUser, isAuthenticated } = useAuth()
const { t } = useI18n()

/**
 * The delivery location is a coordinate pair and nothing else. `location` is
 * whatever the map reported; `locationConfirmed` is the customer's explicit
 * acknowledgement of it. A pin that moves after confirmation clears the
 * acknowledgement, so the order can never be submitted against a location the
 * customer never agreed to.
 */
const location = ref<SelectedLocation | null>(null)
const locationConfirmed = ref(false)

/** Any map update is a new location, so it revokes the old confirmation. */
function onLocationChange(value: SelectedLocation | null) {
  location.value = value
  locationConfirmed.value = false
}

const form = reactive({
  name: currentUser.value?.name ?? '',
  email: currentUser.value?.email ?? '',
  phone: '',
})

const paymentMethod = ref<PaymentMethod>('online')
const submitting = ref(false)
const qrDataUrl = ref('')

onMounted(() => {
  rehydrate()
  // Fill the name/email from the session once it has been revalidated.
  if (currentUser.value) {
    form.name = form.name || currentUser.value.name
    form.email = form.email || currentUser.value.email
  }
})

const cartProducts = computed(() => lines.value)

// OrderController::present() reports shipping 0, so the total is the subtotal.
const shipping = computed(() => 0)
const discount = computed(() => 0)

const canPlaceOrder = computed(
  () => locationConfirmed.value && location.value !== null && !submitting.value,
)

async function generateQr() {
  // A local placeholder only: no payment gateway is wired up on the backend.
  const payload = `KHQR|${total.value.toFixed(2)}`
  qrDataUrl.value = await QRCode.toDataURL(payload, {
    width: 240,
    margin: 1,
    color: { dark: '#1f2937', light: '#ffffff' },
  })
}

watch(total, generateQr, { immediate: true })

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

async function place() {
  // POST /api/orders is behind auth:sanctum.
  if (!isAuthenticated.value) {
    toastError(t('pleaseSignIn'))
    router.push({ name: 'login', query: { redirect: '/checkout' } })
    return
  }

  if (!form.name || !form.email || !form.phone) {
    toastError(t('pleaseFillAll'))
    return
  }

  // The backend requires a coordinate pair, and shipping_address is optional
  // now that no address is ever typed or looked up, so a missing or
  // unconfirmed pin has to stop the submit here rather than producing a 422.
  if (!location.value || !locationConfirmed.value) {
    toastError(t('confirmLocationFirst'))
    return
  }

  if (cart.value.length === 0) return

  submitting.value = true
  try {
    const order = await placeOrder({
      payment_method: paymentMethod.value,
      latitude: location.value.latitude,
      longitude: location.value.longitude,
      phone: form.phone,
      items: cart.value.map((i) => ({ product_id: i.id, quantity: i.qty })),
    })
    toastSuccess(t('orderPlaced'))
    clear()
    router.push(`/account/orders/${order.id}`)
  } catch (e) {
    toastError(e instanceof Error ? e.message : t('operationFailed'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{{ $t('checkout') }}</h1>

    <div v-if="!isEmpty" class="grid gap-10 lg:grid-cols-3">
      <form class="space-y-6 lg:col-span-2" @submit.prevent="place">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">{{ $t('customerInformation') }}</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="co-name" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('fullName') }}</label>
              <input id="co-name" v-model="form.name" type="text" required :class="inputClass" />
            </div>
            <div>
              <label for="co-email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('email') }}</label>
              <input id="co-email" v-model="form.email" type="email" required :class="inputClass" />
            </div>
            <div>
              <label for="co-phone" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('phone') }}</label>
              <input id="co-phone" v-model="form.phone" type="tel" required :class="inputClass" />
            </div>
          </div>
        </div>

        <!--
          Delivery location. There is deliberately no address field: the map
          pin is the only source of truth for the delivery location, and the
          coordinates travel with the form. Nothing converts them to a street
          address, so nothing here can fail on a Geocoding or Places request.
        -->
        <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="mb-1 text-lg font-bold text-gray-900 dark:text-white">{{ $t('deliveryLocation') }}</h2>
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ $t('mapPickHint') }}</p>

          <CheckoutMap @update:location="onLocationChange" />

          <button
            type="button"
            :disabled="!location || locationConfirmed"
            class="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="locationConfirmed
              ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'"
            @click="locationConfirmed = true"
          >
            <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
            {{ locationConfirmed ? $t('locationConfirmed') : $t('confirmLocation') }}
          </button>

          <p
            v-if="!location"
            role="alert"
            class="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
          >
            {{ $t('locationRequired') }}
          </p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">{{ $t('paymentMethod') }}</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="flex items-center gap-3 rounded-xl border-2 p-4 text-left transition"
              :class="paymentMethod === 'online'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
              @click="paymentMethod = 'online'"
            >
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50">
                <QrCode class="h-5 w-5" />
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-900 dark:text-white">{{ $t('onlinePayment') }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">{{ $t('payWithQR') }}</span>
              </span>
            </button>
            <button
              type="button"
              class="flex items-center gap-3 rounded-xl border-2 p-4 text-left transition"
              :class="paymentMethod === 'cod'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
              @click="paymentMethod = 'cod'"
            >
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50">
                <Banknote class="h-5 w-5" />
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-900 dark:text-white">{{ $t('cashOnDelivery') }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">{{ $t('payOnDelivery') }}</span>
              </span>
            </button>
          </div>

          <div v-if="paymentMethod === 'online'" class="mt-5 flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 px-6 py-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="Payment QR code" class="rounded-lg bg-white p-2 shadow-sm" />
            <div v-else class="h-60 w-60 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            <p class="mt-5 text-lg font-bold text-gray-900 dark:text-white">${{ total.toFixed(2) }}</p>
            <p class="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              {{ $t('scanToPay') }}
            </p>
          </div>

          <div v-else class="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {{ $t('codNotice') }}
          </div>
        </div>

        <button
          type="submit"
          :disabled="!canPlaceOrder"
          class="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Lock class="h-4 w-4" />
          {{ submitting ? t('placingOrder') : t('placeOrder') }}
        </button>
      </form>

      <aside class="lg:col-span-1">
        <OrderSummary
          :items="cartProducts.map((l) => ({
            name: l.product.name,
            qty: l.qty,
            price: effectivePrice(l.product),
            image: l.product.image,
          }))"
          :subtotal="subtotal"
          :shipping="shipping"
          :discount="discount"
          :total="total"
        />
      </aside>
    </div>

    <EmptyState
      v-else
      :title="$t('emptyCart')"
      :description="$t('emptyCartMessage')"
      :action-label="$t('browseProducts')"
      action-to="/shop"
    />
  </section>
</template>