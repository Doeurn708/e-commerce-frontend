<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Heart, Mail, Pencil, Phone, Receipt, ShieldCheck, ShoppingCart, UserRound } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { useCart } from '../stores/cart'
import { useWishlist } from '../stores/wishlist'
import { useI18n } from '../stores/i18n'
import { toastError } from '../stores/toast'
import { imageUrl, onImageError } from '../utils/image'
import EditProfileModal from '../components/EditProfileModal.vue'

const router = useRouter()
const { currentUser, fetchUser } = useAuth()
const { totalQty } = useCart()
const { count: wishlistCount } = useWishlist()
const { t } = useI18n()

const loading = ref(false)
const loadFailed = ref(false)
const showEditor = ref(false)

const storedAvatar = computed(
  () => currentUser.value?.avatar_url || currentUser.value?.avatar || '',
)

const avatarSrc = computed(() => (storedAvatar.value ? imageUrl(storedAvatar.value) : ''))

const initials = computed(() => {
  if (currentUser.value?.initials) return currentUser.value.initials

  const words = (currentUser.value?.name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'

  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
})

const roleLabel = computed(() => t(currentUser.value?.role === 'admin' ? 'admin' : 'customer'))

const memberSince = computed(() => {
  const created = currentUser.value?.created_at
  if (!created) return '—'

  const date = new Date(created)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
})

const isActive = computed(() => {
  const value = currentUser.value?.is_active
  return value !== false && value !== 0
})

/** Order count comes from the API, never a placeholder. */
const orderCount = computed(() => Number(currentUser.value?.orders_count ?? 0))

const details = computed(() => [
  { key: 'fullName', value: currentUser.value?.name || '—', icon: UserRound },
  { key: 'email', value: currentUser.value?.email || '—', icon: Mail },
  { key: 'phone', value: currentUser.value?.phone || t('notProvided'), icon: Phone },
  { key: 'memberSince', value: memberSince.value, icon: CalendarDays },
])

const stats = computed(() => [
  { key: 'totalOrders', value: orderCount.value, icon: Receipt, to: '/account/orders' },
  { key: 'wishlist', value: wishlistCount.value, icon: Heart, to: '/account/wishlist' },
  { key: 'cartItems', value: totalQty.value, icon: ShoppingCart, to: '/cart' },
])

async function load() {
  loading.value = true
  loadFailed.value = false

  try {
    await fetchUser()
  } catch {
    loadFailed.value = true
    toastError(t('profileLoadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div class="h-24 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

      <div class="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <div class="-mt-14 shrink-0">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            :alt="currentUser?.name ?? $t('profile')"
            class="h-20 w-20 rounded-full border-4 border-white object-cover dark:border-gray-900"
            @error="onImageError"
          />
          <div
            v-else
            class="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white dark:border-gray-900"
            aria-hidden="true"
          >
            {{ initials }}
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <h2 class="truncate text-xl font-bold text-gray-900 dark:text-white">
            {{ currentUser?.name }}
          </h2>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">
            {{ currentUser?.email }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            :class="currentUser?.role === 'admin'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'"
          >
            {{ roleLabel }}
          </span>

          <span
            class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
            :class="isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="isActive ? 'bg-emerald-500' : 'bg-red-500'"
            />
            {{ isActive ? t('active') : t('inactive') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <component
        :is="loading ? 'div' : 'button'"
        v-for="stat in stats"
        :key="stat.key"
        class="rounded-2xl border border-gray-200 bg-white p-5 text-left transition dark:border-gray-700 dark:bg-gray-900"
        :class="loading ? '' : 'hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-700'"
        @click="!loading && stat.to && router.push(stat.to)"
      >
        <div class="flex items-center justify-between">
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ stat.value }}</p>
          <component :is="stat.icon" class="h-5 w-5 text-indigo-500" />
        </div>
        <p class="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{{ $t(stat.key) }}</p>
      </component>
    </div>

    <!-- Details -->
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">{{ $t('accountInformation') }}</h3>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          :disabled="loading"
          @click="showEditor = true"
        >
          <Pencil class="h-3.5 w-3.5" />
          {{ $t('editProfile') }}
        </button>
      </div>

      <div v-if="loadFailed" class="px-6 py-10 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profileLoadFailed') }}</p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          @click="load"
        >
          {{ $t('retry') }}
        </button>
      </div>

      <dl v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="item in details"
          :key="item.key"
          class="flex items-center gap-3 px-6 py-4"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0 text-gray-400" />
          <dt class="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400">{{ $t(item.key) }}</dt>
          <dd class="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ item.value }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Security -->
    <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div class="flex items-center gap-3">
        <ShieldCheck class="h-5 w-5 text-indigo-500" />
        <h3 class="text-base font-bold text-gray-900 dark:text-white">{{ $t('security') }}</h3>
      </div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ $t('securityHint') }}</p>
      <RouterLink
        to="/forgot-password"
        class="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {{ $t('changePassword') }}
      </RouterLink>
    </div>

    <EditProfileModal v-if="showEditor" @close="showEditor = false" />
  </div>
</template>
