<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Receipt,
  Settings,
  UserCog,
  UserCircle,
} from '@lucide/vue'
import { useAuth } from '../stores/auth'
import { useI18n } from '../stores/i18n'
import { imageUrl, onImageError } from '../utils/image'
const route = useRoute()
const router = useRouter()
const { currentUser, logout } = useAuth()
const { t } = useI18n()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const signingOut = ref(false)

/** The stored avatar when there is one, otherwise a local initial bubble. */
const avatarSrc = computed(() => {
  const src = currentUser.value?.avatar_url || currentUser.value?.avatar
  return src ? imageUrl(src) : ''
})

const fallbackInitials = computed(() => {
  const stored = currentUser.value?.initials
  if (stored) return stored

  const words = (currentUser.value?.name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'

  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
})

const items = computed(() => [
  { key: 'profile', label: t('myProfile'), to: '/profile', icon: UserCircle },
  ...(currentUser.value?.role === 'admin'
    ? [{ key: 'dashboard', label: t('dashboard'), to: '/admin', icon: LayoutDashboard }]
    : [
        { key: 'orders', label: t('myOrders'), to: '/account/orders', icon: Receipt },
        { key: 'settings', label: t('settings'), to: '/account/settings', icon: Settings },
      ]),
])

function isActive(path: string) {
  return route.path === path
}

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  close()

  try {
    await logout()
    router.push('/login')
  } finally {
    signingOut.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('keydown', onKeydown)
})

// Navigating anywhere should not leave the panel hanging open.
watch(() => route.path, close)
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center justify-center gap-2 "
      :aria-expanded="open"
      :aria-haspopup="'menu'"
      :aria-label="currentUser?.name ?? $t('profile')"
      @click.stop="toggle"
    >
      <img
        v-if="avatarSrc"
        :src="avatarSrc"
        :alt="currentUser?.name ?? $t('profile')"
        class="w-8 h-8 shrink-0 rounded-lg object-cover"
        @error="onImageError"
      />
      <span
        v-else
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white"
        aria-hidden="true"
      >
        {{ fallbackInitials }}
      </span>

    
      <!-- <ChevronDown class="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400" :class="open && 'rotate-180'" /> -->
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="open"
        role="menu"
        class="absolute right-0 z-50 mt-2  origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="flex items-center rounded gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            :alt="currentUser?.name ?? ''"
            class="h-10 w-10 shrink-0 rounded-full object-cover"
            @error="onImageError"
          />
          <span
            v-else
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white"
            aria-hidden="true"
          >
            {{ fallbackInitials }}
          </span>

          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ currentUser?.name }}
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ currentUser?.email }}
            </p>
          </div>
        </div>

        <div class="p-1.5">
          <RouterLink
            v-for="item in items"
            :key="item.key"
            :to="item.to"
            role="menuitem"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition"
            :class="isActive(item.to)
              ? 'bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
            @click="close"
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>

          <div class="my-1.5 border-t border-gray-100 dark:border-gray-800" />

          <RouterLink
            to="/profile"
            role="menuitem"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            @click="close"
          >
            <UserCog class="h-4 w-4 shrink-0" />
            <span class="truncate">{{ $t('editProfile') }}</span>
          </RouterLink>

          <button
            type="button"
            role="menuitem"
            :disabled="signingOut"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30"
            @click="signOut"
          >
            <Loader2 v-if="signingOut" class="h-4 w-4 shrink-0 animate-spin" />
            <LogOut v-else class="h-4 w-4 shrink-0" />
            <span class="truncate">{{ signingOut ? $t('signingOut') : $t('logout') }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
