<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, Lock } from '@lucide/vue'

interface Props {
  id: string
  label: string
  modelValue: string
  placeholder?: string
  autocomplete?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  autocomplete: 'current-password',
  error: '',
  required: false,
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const visible = ref(false)

function toggleVisibility() {
  visible.value = !visible.value
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div>
    <label
      :for="props.id"
      class="mb-1.5 block text-sm font-medium text-[#111827] dark:text-[#F8FAFC]"
    >
      {{ props.label }}
      <span v-if="props.required" class="text-[#EF4444]">*</span>
    </label>

    <div class="relative">
      <span class="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#94A3B8]">
        <Lock class="h-4 w-4" />
      </span>

      <input
        :id="props.id"
        :type="visible ? 'text' : 'password'"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :autocomplete="props.autocomplete"
        :required="props.required"
        :disabled="props.disabled"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? `${props.id}-error` : undefined"
        class="h-12 w-full rounded-lg border bg-white pl-11 pr-12 text-sm text-[#111827] shadow-sm outline-none transition duration-200 placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:placeholder:text-[#64748B]"
        :class="props.error ? 'border-[#EF4444] dark:border-[#EF4444]' : 'border-[#E2E8F0] hover:border-[#CBD5E1] dark:border-[#334155] dark:hover:border-[#475569]'"
        @input="onInput"
      />

      <button
        type="button"
        class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#94A3B8] transition-colors hover:text-[#4F46E5] focus:outline-none dark:hover:text-white"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :title="visible ? 'Hide password' : 'Show password'"
        @click="toggleVisibility"
      >
        <EyeOff v-if="visible" class="h-4 w-4" />
        <Eye v-else class="h-4 w-4" />
      </button>
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