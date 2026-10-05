<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Package, Receipt, Users, Settings, LogOut, Store, Tag, Menu, X, Sun, Moon, Languages } from '@lucide/vue'
import { useAuth } from '../stores/auth'
import { useTheme } from '../stores/theme'
import { useI18n } from '../stores/i18n'

const route = useRoute()
const router = useRouter()
const { logout, currentUser } = useAuth()
const { isDark, toggleTheme } = useTheme()
const { locale, toggleLocale } = useI18n()

const sidebarOpen = ref(false)

const links = [
  { name: 'admin-dashboard', labelKey: 'dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'admin-products', labelKey: 'productsTitle', to: '/admin/products', icon: Package },
  { name: 'admin-categories', labelKey: 'categories', to: '/admin/categories', icon: Tag },
  { name: 'admin-orders', labelKey: 'orders', to: '/admin/orders', icon: Receipt },
  { name: 'admin-customers', labelKey: 'customers', to: '/admin/customers', icon: Users },
  { name: 'admin-settings', labelKey: 'settings', to: '/account/settings', icon: Settings },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === to
  return route.path.startsWith(to)
}

function isLinkActive(to: string) {
  return isActive(to)
}

const currentLink = computed(() => links.find((link) => isLinkActive(link.to)) ?? links[0])

function closeSidebar() {
  sidebarOpen.value = false
}

async function signOut() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-100 transition-colors duration-300 dark:bg-gray-950">
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="closeSidebar"></div>

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 -translate-x-full flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static lg:z-auto lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : ''"
    >
      <div class="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
        <RouterLink to="/admin" class="flex items-center gap-2">
          <img
            src="/image/image.png"
            alt="Chandoeurn Logo"
            class="h-9 w-auto object-contain"
          />
          <span class="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">Admin</span>
        </RouterLink>
        <button
          type="button"
          class="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          :aria-label="'Close menu'"
          @click="closeSidebar"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-4">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="link.to"
          class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition"
          :class="isLinkActive(link.to)
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300'"
          @click="closeSidebar"
        >
          <component :is="link.icon" class="h-5 w-5" />
          {{ $t(link.labelKey) }}
        </RouterLink>
      </nav>

      <div class="border-t border-gray-200 p-4 dark:border-gray-800">
        <p class="mb-3 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{{ currentUser?.name }}</p>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          @click="signOut"
        >
          <LogOut class="h-4 w-4" />
          {{ $t('logout') }}
        </button>
        <!-- <RouterLink to="/" class="mt-2 flex items-center justify-center gap-1 text-center text-sm text-gray-500 transition hover:text-indigo-600 dark:text-gray-400">
          <Store class="h-4 w-4" />
          {{ $t('viewStore') }}
        </RouterLink> -->
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            :aria-label="'Open menu'"
            @click="sidebarOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t(currentLink?.labelKey ?? 'dashboard') }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            :aria-label="isDark ? $t('lightMode') : $t('darkMode')"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>

          <button
            type="button"
            class="flex items-center gap-1 rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            :aria-label="'Language'"
            @click="toggleLocale"
          >
            <Languages class="h-5 w-5" />
            <span class="text-xs font-semibold">{{ locale.toUpperCase() }}</span>
          </button>

          <RouterLink
            to="/"
            class="hidden items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex"
          >
            <Store class="h-4 w-4" />
            {{ $t('viewStore') }}
          </RouterLink>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>