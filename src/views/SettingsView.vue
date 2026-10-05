<script setup lang="ts">
import { ref } from 'vue'
import { toastSuccess } from '../stores/toast'
import { useTheme } from '../stores/theme'
import { useI18n, type Locale } from '../stores/i18n'

const { isDark, toggleTheme } = useTheme()
const { locale, toggleLocale, t } = useI18n()
const notify = ref(true)
const twoFactor = ref(false)

function save() {
  toastSuccess('Settings saved')
}
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="mb-6 text-xl font-bold text-gray-900 dark:text-white">Settings</h2>

    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-800 dark:text-gray-100">{{ t('darkMode') }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
        </div>
        <button
          type="button"
          class="relative h-7 w-12 rounded-full transition"
          :class="isDark ? 'bg-indigo-600' : 'bg-gray-300'"
          role="switch"
          :aria-checked="isDark"
          @click="toggleTheme"
        >
          <span
            class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
            :class="isDark ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'"
          ></span>
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-800 dark:text-gray-100">Language</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">English / ភាសាខ្មែរ</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-200"
          @click="toggleLocale"
        >
          {{ locale === 'en' ? 'កម្ពុជា · KH' : 'English · EN' }}
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-800 dark:text-gray-100">Email Notifications</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Order updates and offers</p>
        </div>
        <button
          type="button"
          class="relative h-7 w-12 rounded-full transition"
          :class="notify ? 'bg-indigo-600' : 'bg-gray-300'"
          role="switch"
          :aria-checked="notify"
          @click="notify = !notify"
        >
          <span
            class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
            :class="notify ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'"
          ></span>
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-800 dark:text-gray-100">Two-Factor Authentication</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Extra security for your account</p>
        </div>
        <button
          type="button"
          class="relative h-7 w-12 rounded-full transition"
          :class="twoFactor ? 'bg-indigo-600' : 'bg-gray-300'"
          role="switch"
          :aria-checked="twoFactor"
          @click="twoFactor = !twoFactor"
        >
          <span
            class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
            :class="twoFactor ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'"
          ></span>
        </button>
      </div>

      <button
        type="button"
        class="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        @click="save"
      >
        Save Settings
      </button>
    </div>
  </div>
</template>