<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Package, Heart, ShoppingCart, Settings, LogOut } from '@lucide/vue'
import { useAuth } from '../stores/auth'
import { useCart } from '../stores/cart'
import { useWishlist } from '../stores/wishlist'
import { imageUrl, onImageError } from '../utils/image'

const route = useRoute()
const router = useRouter()
const { currentUser, logout } = useAuth()
const { totalQty } = useCart()
const { count: wishlistCount } = useWishlist()

const links: {
  name: string
  to: string
  icon: unknown
  badge?: 'wishlist' | 'cart'
}[] = [
  { name: 'profile', to: '/profile', icon: User },
  { name: 'orders', to: '/account/orders', icon: Package },
  { name: 'wishlist', to: '/account/wishlist', icon: Heart, badge: 'wishlist' },
  { name: 'cart', to: '/cart', icon: ShoppingCart, badge: 'cart' },
  { name: 'settings', to: '/account/settings', icon: Settings },
]

function isActive(to: string) {
  return route.path === to
}

function badgeFor(link: { to: string; badge?: 'wishlist' | 'cart' }) {
  if (link.badge === 'cart') return totalQty.value
  if (link.badge === 'wishlist') return wishlistCount.value
  return 0
}

/** Same source order as Navbar/ProfileView: the delivery URL wins over the raw column. */
const storedAvatar = computed(
  () => currentUser.value?.avatar_url || currentUser.value?.avatar || '',
)

const avatarSrc = computed(() => (storedAvatar.value ? imageUrl(storedAvatar.value) : ''))

/**
 * `?? 'U'` is not enough on its own: an empty or whitespace-only name splits
 * into empty parts and renders a blank circle, so the parts are filtered first.
 * Kept in step with the ProfileView implementation.
 */
const initials = computed(() => {
  if (currentUser.value?.initials) return currentUser.value.initials

  const words = (currentUser.value?.name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'

  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
})

async function signOut() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{{ $t('myAccount') }}</h1>

    <div class="grid gap-8 lg:grid-cols-4">
      <aside class="lg:col-span-1 lg:h-fit lg:sticky lg:top-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div class="mb-6 flex items-center gap-3 border-b border-gray-100 pb-6 dark:border-gray-800">
            <img
              v-if="avatarSrc"
              :src="avatarSrc"
              :alt="currentUser?.name ?? $t('myProfile')"
              class="h-12 w-12 shrink-0 rounded-full object-cover"
              @error="onImageError"
            />
            <div
              v-else
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
              aria-hidden="true"
            >
              {{ initials }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ currentUser?.name }}</p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ currentUser?.email }}</p>
              <span
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="currentUser?.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'"
              >
                {{ currentUser?.role }}
              </span>
            </div>
          </div>

          <nav class="space-y-1">
            <RouterLink
              v-for="link in links"
              :key="link.name"
              :to="link.to"
              class="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition"
              :class="isActive(link.to)
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-300'"
            >
              <span class="flex items-center gap-3">
                <component :is="link.icon" class="h-5 w-5" />
                {{ $t(link.name) }}
              </span>
              <span
                v-if="link.badge && badgeFor(link) > 0"
                class="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white"
              >
                {{ badgeFor(link) }}
              </span>
            </RouterLink>
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30"
              @click="signOut"
            >
              <LogOut class="h-5 w-5" />
              {{ $t('logout') }}
            </button>
          </nav>
        </div>
      </aside>

      <div class="lg:col-span-3">
        <RouterView />
      </div>
    </div>
  </section>
</template>