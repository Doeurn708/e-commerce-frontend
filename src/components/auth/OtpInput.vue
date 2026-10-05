<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'

interface Props {
  modelValue: string
  length?: number
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  length: 6,
  disabled: false,
  error: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'complete', value: string): void
}>()

const digits = ref<string[]>(Array.from({ length: props.length }, () => ''))
const inputs = ref<HTMLInputElement[]>([])

function syncDigits(value: string) {
  const next = (value ?? '').split('')
  const list = Array.from({ length: props.length }, (_, i) => next[i] ?? '')
  digits.value = list
}

watch(
  () => props.modelValue,
  (value) => syncDigits(value),
  { immediate: true },
)

watch(
  () => props.length,
  (length) => {
    const previous = digits.value
    const list = Array.from({ length }, (_, i) => previous[i] ?? '')
    digits.value = list
    emitValue()
  },
)

function setRef(el: unknown, index: number) {
  if (el && el instanceof HTMLElement) {
    inputs.value[index] = el as HTMLInputElement
  }
}

function focusAt(index: number) {
  const el = inputs.value[index]
  if (el) el.focus()
}

function emitValue() {
  const value = digits.value.join('')
  emit('update:modelValue', value)
  if (value.length === props.length) emit('complete', value)
}

function onInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  if (!raw) {
    target.value = digits.value[index]
    return
  }

  const parts = [...digits.value]
  parts[index] = raw[0]
  const rest = raw.slice(1)
  const fill = Math.min(rest.length, props.length - index - 1)
  for (let i = 1; i <= fill; i++) {
    parts[index + i] = rest[i - 1]
  }
  digits.value = parts
  emitValue()

  const nextIndex = Math.min(index + fill + 1, props.length - 1)
  focusAt(nextIndex)
}

function onKeydown(index: number, event: KeyboardEvent) {
  const parts = [...digits.value]

  switch (event.key) {
    case 'Backspace': {
      event.preventDefault()
      if (parts[index]) {
        parts[index] = ''
      } else if (index > 0) {
        parts[index - 1] = ''
        focusAt(index - 1)
      } else {
        return
      }
      digits.value = parts
      emitValue()
      break
    }
    case 'Delete': {
      event.preventDefault()
      if (parts[index]) {
        parts[index] = ''
        digits.value = parts
        emitValue()
      }
      break
    }
    case 'ArrowLeft': {
      event.preventDefault()
      if (index > 0) focusAt(index - 1)
      break
    }
    case 'ArrowRight': {
      event.preventDefault()
      if (index < props.length - 1) focusAt(index + 1)
      break
    }
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') ?? ''
  const raw = text.replace(/\D/g, '')
  if (!raw) return

  const active = document.activeElement
  const activeIndex = inputs.value.indexOf(active as HTMLInputElement)
  const start = activeIndex >= 0 ? activeIndex : 0

  const parts = [...digits.value]
  for (let i = 0; i < raw.length && start + i < props.length; i++) {
    parts[start + i] = raw[i]
  }
  digits.value = parts
  emitValue()

  const target = Math.min(start + raw.length, props.length) - 1
  focusAt(target)
}

onMounted(() => {
  const firstEmpty = digits.value.findIndex((d) => !d)
  focusAt(firstEmpty === -1 ? props.length - 1 : firstEmpty)
})
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 sm:gap-2.5"
    @paste="onPaste"
  >
    <input
      v-for="(digit, index) in digits"
      :id="`otp-${index}`"
      :key="index"
      :ref="(el: unknown) => setRef(el, index)"
      :value="digit"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="6"
      autocomplete="one-time-code"
      :disabled="props.disabled"
      :aria-label="`OTP digit ${index + 1} of ${props.length}`"
      :aria-invalid="!!props.error"
      class="h-12 w-full max-w-[52px] min-w-0 flex-1 rounded-lg border bg-white text-center text-lg font-semibold text-[#111827] shadow-sm outline-none transition duration-200 placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:max-w-[56px] dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:placeholder:text-[#64748B]"
      :class="
        props.error
          ? 'border-[#EF4444] dark:border-[#EF4444]'
          : 'border-[#E2E8F0] hover:border-[#CBD5E1] dark:border-[#334155] dark:hover:border-[#475569]'
      "
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
    />
  </div>
</template>