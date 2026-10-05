<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, ShoppingCart, Moon, Sun, Languages, Menu, X } from '@lucide/vue'
import { useAuth } from '../stores/auth'
import { useCart } from '../stores/cart'
import { useTheme } from '../stores/theme'
import { useI18n } from '../stores/i18n'
import { imageUrl, onImageError } from '../utils/image'
import ProfileMenu from './ProfileMenu.vue'

const route = useRoute()
const { currentUser, isAuthenticated } = useAuth()
const { totalQty } = useCart()
const { isDark, toggleTheme } = useTheme()
const { locale, toggleLocale } = useI18n()

const mobileOpen = ref(false)

const ACTIVE_CLASS = 'text-indigo-600 dark:text-indigo-400 font-semibold'

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function activeClass(to: string) {
  return isActive(to) ? ACTIVE_CLASS : 'text-gray-600 dark:text-gray-300'
}

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)

const links = [
  { name: 'home', to: '/' },
  { name: 'shop', to: '/shop' },
  { name: 'categories', to: '/categories' },
  { name: 'orders', to: '/account/orders', auth: true },
  { name: 'about', to: '/about' },
].filter((link) => !link.auth || isAuthenticated.value)
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-gray-200/80 bg-white/85 backdrop-blur-md transition-colors duration-300 dark:border-gray-800/80 dark:bg-gray-900/85 shadow-xs">
    <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
      
      <!-- Left: Mobile Menu Button & Image Logo -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 transition-all hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
          :aria-label="$t('menu')"
          @click="mobileOpen = !mobileOpen"
        >
          <Menu v-if="!mobileOpen" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>

        <RouterLink to="/" class="group flex items-center gap-2">
          <img
            src="/image/image.png"
            alt="Chandoeurn Logo"
            class="h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </RouterLink>
      </div>

      <!-- Center: Desktop Navigation Links -->
      <ul class="hidden items-center gap-1 md:flex">
        <li v-for="link in links" :key="link.name">
          <RouterLink
            :to="link.to"
            class="relative px-4 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
            :class="activeClass(link.to)"
          >
            {{ $t(link.name) }}
            <span 
              v-if="isActive(link.to)"
              class="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
            />
          </RouterLink>
        </li>
      </ul>

      <!-- Right: Actions & Profile -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <RouterLink 
          to="/shop" 
          :aria-label="$t('search')" 
          class="rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
        >
          <Search class="h-5 w-5" />
        </RouterLink>

        <RouterLink 
          to="/cart" 
          :aria-label="$t('cart')" 
          class="relative rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
        >
          <ShoppingCart class="h-5 w-5" />
          <span
            v-if="totalQty > 0"
            class="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse"
          >
            {{ totalQty }}
          </span>
        </RouterLink>

        <button
          type="button"
          class="rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
          :aria-label="isDark ? $t('lightMode') : $t('darkMode')"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>

        <button
          type="button"
          class="hidden sm:flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
          :aria-label="$t('language')"
          @click="toggleLocale"
        >
          <Languages class="h-4 w-4" />
          <span class="text-xs font-bold">{{ locale.toUpperCase() }}</span>
        </button>

        <div class="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

        <!-- Auth Section -->
        <ProfileMenu v-if="isAuthenticated" />

        <RouterLink
          v-else
          to="/login"
          class="hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-indigo-500/25 sm:inline-block"
        >
          {{ $t('account') }}
        </RouterLink>
      </div>
    </nav>

    <!-- Mobile Drawer Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileOpen" class="border-t border-gray-200 bg-white/95 px-4 pb-6 pt-3 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95 md:hidden shadow-lg">
        <ul class="flex flex-col gap-1.5">
          <li v-for="link in links" :key="link.name">
            <RouterLink
              :to="link.to"
              class="block rounded-xl px-4 py-3 text-sm font-medium transition-all"
              :class="isActive(link.to)
                ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'"
            >
              {{ $t(link.name) }}
            </RouterLink>
          </li>
        </ul>

        <div class="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            class="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 sm:hidden"
            @click="toggleLocale"
          >
            <span class="flex items-center gap-2">
              <Languages class="h-4 w-4" />
              {{ $t('language') }}
            </span>
            <span class="rounded-md bg-gray-200/60 px-2 py-0.5 text-xs font-bold dark:bg-gray-700">{{ locale.toUpperCase() }}</span>
          </button>

          <RouterLink
            v-if="isAuthenticated"
            to="/profile"
            class="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-indigo-950/50"
          >
            <img
              v-if="currentUser?.avatar_url || currentUser?.avatar"
              :src="imageUrl(currentUser.avatar_url || currentUser.avatar || '')"
              :alt="currentUser.name"
              class="h-8 w-8 shrink-0 rounded-lg object-cover"
              @error="onImageError"
            />
            <span
              v-else
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {{ currentUser?.initials || currentUser?.name?.charAt(0) || '?' }}
            </span>
            <span class="truncate">{{ currentUser?.name }}</span>
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {{ $t('account') }}
          </RouterLink>
        </div>
      </div>
    </Transition>
  </header>
</template>