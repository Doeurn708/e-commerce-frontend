<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from '@lucide/vue'

interface Props {
  value: string
}

const props = defineProps<Props>()

const rules = computed(() => [
  { label: 'At least 8 characters', met: props.value.length >= 8 },
  { label: 'One uppercase letter', met: /[A-Z]/.test(props.value) },
  { label: 'One number', met: /[0-9]/.test(props.value) },
])

const metCount = computed(() => rules.value.filter((r) => r.met).length)

const label = computed(() => {
  if (metCount.value <= 1) return { text: 'Weak', className: 'text-[#EF4444]', bar: 'bg-[#EF4444]' }
  if (metCount.value === 2) return { text: 'Medium', className: 'text-amber-500 dark:text-amber-400', bar: 'bg-amber-500' }
  return { text: 'Strong', className: 'text-[#22C55E]', bar: 'bg-[#22C55E]' }
})
</script>

<template>
  <div
    v-if="props.value.length > 0"
    class="mt-2.5 space-y-2 rounded-lg bg-gray-50 px-3.5 py-3 dark:bg-[#0F172A]"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Password strength</span>
      <span class="text-xs font-semibold" :class="label.className">{{ label.text }}</span>
    </div>

    <div class="flex h-1.5 gap-1">
      <div
        v-for="i in 3"
        :key="i"
        class="flex-1 rounded-full"
        :class="metCount >= i ? label.bar : 'bg-[#E2E8F0] dark:bg-[#334155]'"
      />
    </div>

    <ul class="space-y-1 pt-0.5">
      <li
        v-for="rule in rules"
        :key="rule.label"
        class="flex items-center gap-1.5 text-xs"
        :class="rule.met ? 'text-[#111827] dark:text-[#F8FAFC]' : 'text-[#64748B] dark:text-[#94A3B8]'"
      >
        <Check v-if="rule.met" class="h-3.5 w-3.5 shrink-0 text-[#22C55E]" />
        <X v-else class="h-3.5 w-3.5 shrink-0 text-[#94A3B8] dark:text-[#64748B]" />
        {{ rule.label }}
      </li>
    </ul>
  </div>
</template>