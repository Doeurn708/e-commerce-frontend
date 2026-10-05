<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ShoppingBag, ArrowLeft } from '@lucide/vue'
import CartItem from '../components/CartItem.vue'
import OrderSummary from '../components/OrderSummary.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCart } from '../stores/cart'

const { cart, lines, isEmpty, subtotal, total, rehydrating, rehydrate } = useCart()

onMounted(() => {
  // A refresh only stores { id, qty }; pull the product rows back from the API.
  rehydrate()
})

const cartProducts = computed(() => lines.value)

/**
 * The backend charges the sum of the line items only: OrderController::present()
 * reports `shipping: 0`, so the cart must not invent a delivery fee.
 */
const shipping = computed(() => 0)
const discount = computed(() => 0)
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{{ $t('cart') }}</h1>

    <div v-if="rehydrating && !isEmpty" class="space-y-4">
      <div v-for="n in 2" :key="n" class="h-28 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
    </div>

    <div v-else-if="!isEmpty" class="grid gap-10 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <CartItem v-for="line in cartProducts" :key="line.product.id" :product="line.product" :qty="line.qty" />
        <RouterLink
          to="/shop"
          class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600 dark:text-gray-400"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ $t('continueShopping') }}
        </RouterLink>
      </div>

      <aside class="lg:col-span-1">
        <OrderSummary
          :items="cartProducts.map((l) => ({ name: l.product.name, qty: l.qty, price: l.product.price }))"
          :subtotal="subtotal"
          :shipping="shipping"
          :discount="discount"
          :total="total"
        >
          <RouterLink
            to="/checkout"
            class="mt-6 block w-full rounded-full bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700"
          >
            {{ $t('proceedToCheckout') }}
          </RouterLink>
        </OrderSummary>
      </aside>
    </div>

    <EmptyState
      v-else
      :icon="ShoppingBag"
      :title="$t('emptyCart')"
      :description="$t('emptyCartMessage')"
      :action-label="$t('browseProducts')"
      action-to="/shop"
    />
  </section>
</template>