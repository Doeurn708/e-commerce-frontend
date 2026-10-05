<script setup lang="ts">
import { ShoppingBag } from '@lucide/vue'

interface Props {
  title: string
  subtitle: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="mb-8 text-center">
    <div class="mb-6 inline-flex items-center justify-center gap-2.5">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white">
        <ShoppingBag class="h-5 w-5" />
      </span>
      <span class="text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Chandoeurn</span>
    </div>

    <h1 class="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#F8FAFC]">
      {{ props.title }}
    </h1>
    <p class="mt-2 text-sm leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
      {{ props.subtitle }}
    </p>
  </div>
</template>