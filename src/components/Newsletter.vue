<script setup lang="ts">
import { ref } from 'vue'
import { Send } from '@lucide/vue'
import { toastSuccess } from '../stores/toast'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()
const email = ref('')

function subscribe() {
  if (!email.value) return
  toastSuccess(t('newsletterSuccess'))
  email.value = ''
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-16">
    <div class="rounded-3xl bg-gray-900 px-8 py-16 text-center dark:bg-gray-800">
      <h2 class="text-3xl font-bold text-white">{{ $t('newsletterTitle') }}</h2>
      <p class="mt-3 text-gray-400">{{ $t('newsletterSubtitle') }}</p>
      <form class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" @submit.prevent="subscribe">
        <input
          v-model="email"
          type="email"
          required
          :placeholder="t('emailPlaceholder')"
          class="w-full rounded-full border border-gray-700 bg-gray-800 px-5 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-indigo-500"
        />
        <button type="submit" class="flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
          {{ $t('subscribe') }}
          <Send class="h-4 w-4" />
        </button>
      </form>
    </div>
  </section>
</template>