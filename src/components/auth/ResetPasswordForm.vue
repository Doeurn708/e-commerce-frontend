<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CircleCheck } from '@lucide/vue'
import { apiResetPassword } from '../../api/auth'
import {
  clearResetState,
  getResetEmail,
  getResetOtp,
  isResetVerified,
} from '../../utils/passwordReset'
import { toastSuccess } from '../../stores/toast'
import PasswordInput from './PasswordInput.vue'
import AuthButton from './AuthButton.vue'

const router = useRouter()

const email = ref(getResetEmail())

const password = ref('')
const confirm = ref('')
const errors = ref<Record<string, string>>({})
const formError = ref('')
const submitting = ref(false)
const done = ref(false)

const requirements = computed(() => [
  { label: 'At least 8 characters', met: password.value.length >= 8 },
  { label: 'Contains one uppercase letter', met: /[A-Z]/.test(password.value) },
  { label: 'Contains one lowercase letter', met: /[a-z]/.test(password.value) },
  { label: 'Contains one number', met: /[0-9]/.test(password.value) },
])

function validate() {
  const next: Record<string, string> = {}
  if (!password.value) {
    next.password = 'Password is required'
  } else if (password.value.length < 8) {
    next.password = 'Password must contain at least 8 characters'
  } else {
    if (!/[A-Z]/.test(password.value)) next.password = 'Password must contain an uppercase letter'
    else if (!/[a-z]/.test(password.value)) next.password = 'Password must contain a lowercase letter'
    else if (!/[0-9]/.test(password.value)) next.password = 'Password must contain a number'
  }
  if (!confirm.value) {
    next.confirm = 'Please confirm your password'
  } else if (confirm.value !== password.value) {
    next.confirm = "Passwords don't match"
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function clearError(field: string) {
  if (errors.value[field]) errors.value[field] = ''
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  formError.value = ''
  try {
    await apiResetPassword(email.value, password.value, confirm.value, getResetOtp())
    done.value = true
    clearResetState()
    toastSuccess('Password reset successfully')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Unable to reset password'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!email.value || !isResetVerified()) {
    router.replace('/forgot-password')
  }
})
</script>

<template>
  <div v-if="done" class="text-center">
    <span class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/10">
      <CircleCheck class="h-7 w-7 text-[#22C55E]" />
    </span>
    <h2 class="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Password Reset Successfully</h2>
    <p class="mt-2 text-sm leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
      Your password has been updated successfully. You can now login with your new password.
    </p>
    <RouterLink
      to="/login"
      class="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#4F46E5] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#4338CA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111827]"
    >
      Back to Login
    </RouterLink>
  </div>

  <form v-else class="space-y-5" novalidate @submit.prevent="submit">
    <PasswordInput
      id="new-password"
      v-model="password"
      label="New Password"
      placeholder="Enter new password"
      autocomplete="new-password"
      required
      :error="errors.password"
      @update:model-value="clearError('password')"
    />

    <div
      v-if="password.length > 0"
      class="space-y-2 rounded-lg bg-gray-50 px-3.5 py-3 dark:bg-[#0F172A]"
    >
      <span class="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Password requirements</span>
      <ul class="space-y-1.5">
        <li
          v-for="rule in requirements"
          :key="rule.label"
          class="flex items-center gap-1.5 text-xs"
          :class="rule.met ? 'text-[#111827] dark:text-[#F8FAFC]' : 'text-[#64748B] dark:text-[#94A3B8]'"
        >
          <Check
            class="h-3.5 w-3.5 shrink-0"
            :class="rule.met ? 'text-[#22C55E]' : 'text-[#94A3B8] dark:text-[#64748B]'"
          />
          {{ rule.label }}
        </li>
      </ul>
    </div>

    <PasswordInput
      id="confirm-password"
      v-model="confirm"
      label="Confirm Password"
      placeholder="Confirm new password"
      autocomplete="new-password"
      required
      :error="errors.confirm"
      @update:model-value="clearError('confirm')"
    />

    <p
      v-if="formError"
      class="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3 text-xs leading-relaxed text-[#B91C1C] dark:border-[#EF4444]/40 dark:bg-[#EF4444]/10 dark:text-[#FCA5A5]"
    >
      {{ formError }}
    </p>

    <AuthButton :loading="submitting" loading-text="Resetting Password...">
      Reset Password
    </AuthButton>

    <RouterLink
      to="/login"
      class="block text-center text-sm font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
    >
      Remember your password? Login
    </RouterLink>
  </form>
</template>