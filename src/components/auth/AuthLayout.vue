<script setup lang="ts">
import AuthHeader from './AuthHeader.vue'

interface Props {
  title: string
  subtitle: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10 dark:bg-[#0F172A]">
    <div class="w-full max-w-[420px]">
      <div class="rounded-2xl border border-[#E2E8F0] bg-white px-7 py-8 shadow-sm sm:px-9 sm:py-10 dark:border-[#334155] dark:bg-[#111827] dark:shadow-none">
        <AuthHeader :title="props.title" :subtitle="props.subtitle" />
        <slot />
      </div>

      <div v-if="$slots.extras" class="mt-6 text-center">
        <slot name="extras" />
      </div>
    </div>
  </div>
</template>