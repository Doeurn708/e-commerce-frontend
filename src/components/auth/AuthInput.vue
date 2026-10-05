<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  id: string
  label: string
  modelValue: string
  type?: 'text' | 'email'
  placeholder?: string
  autocomplete?: string
  hint?: string
  error?: string
  icon?: Component
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  autocomplete: 'off',
  hint: '',
  error: '',
  icon: undefined,
  required: false,
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div>
    <label
      :for="props.id"
      class="mb-1.5 flex items-center justify-between text-sm font-medium text-[#111827] dark:text-[#F8FAFC]"
    >
      <span>
        {{ props.label }}
        <span v-if="props.required" class="text-[#EF4444]">*</span>
      </span>
      <span v-if="props.hint" class="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">{{ props.hint }}</span>
    </label>

    <div class="relative">
      <span
        v-if="props.icon"
        class="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#94A3B8]"
      >
        <component :is="props.icon" class="h-4 w-4" />
      </span>

      <input
        :id="props.id"
        :type="props.type"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :autocomplete="props.autocomplete"
        :required="props.required"
        :disabled="props.disabled"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? `${props.id}-error` : undefined"
        class="h-12 w-full rounded-lg border bg-white px-4 text-sm text-[#111827] shadow-sm outline-none transition duration-200 placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:placeholder:text-[#64748B]"
        :class="[
          props.icon ? 'pl-11' : '',
          props.error
            ? 'border-[#EF4444] dark:border-[#EF4444]'
            : 'border-[#E2E8F0] hover:border-[#CBD5E1] dark:border-[#334155] dark:hover:border-[#475569]',
        ]"
        @input="onInput"
      />
    </div>

    <p
      v-if="props.error"
      :id="`${props.id}-error`"
      class="mt-1.5 text-xs font-medium text-[#EF4444]"
    >
      {{ props.error }}
    </p>
  </div>
</template>