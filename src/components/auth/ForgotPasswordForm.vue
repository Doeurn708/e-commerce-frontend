<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail } from '@lucide/vue'
import { apiSendOtp } from '../../api/auth'
import { setResetEmail } from '../../utils/passwordReset'
import { toastError, toastSuccess } from '../../stores/toast'
import AuthInput from './AuthInput.vue'
import AuthButton from './AuthButton.vue'

const router = useRouter()

const email = ref('')
const emailError = ref('')
const formError = ref('')
const submitting = ref(false)

function validate() {
  const value = email.value.trim()
  if (!value) {
    emailError.value = 'Email address is required'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    emailError.value = 'Enter a valid email address'
    return false
  }
  emailError.value = ''
  return true
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  formError.value = ''
  try {
    await apiSendOtp(email.value.trim())
    setResetEmail(email.value.trim())
    toastSuccess('Verification code sent to your email')
    router.push('/verify-otp')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Unable to send verification code'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <AuthInput
      id="forgot-email"
      v-model="email"
      label="Email address"
      type="email"
      placeholder="Enter your email address"
      autocomplete="email"
      required
      :error="emailError"
      :icon="Mail"
      @update:model-value="emailError = ''"
    />

    <p
      v-if="formError"
      class="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3 text-xs leading-relaxed text-[#B91C1C] dark:border-[#EF4444]/40 dark:bg-[#EF4444]/10 dark:text-[#FCA5A5]"
    >
      {{ formError }}
    </p>

    <AuthButton :loading="submitting" loading-text="Sending OTP...">
      Send OTP
    </AuthButton>

    <RouterLink
      to="/login"
      class="block text-center text-sm font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
    >
      Remember your password? Login
    </RouterLink>
  </form>
</template>