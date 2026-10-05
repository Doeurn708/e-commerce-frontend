<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Mail, TimerReset } from '@lucide/vue'
import { apiSendOtp, apiVerifyOtp } from '../../api/auth'
import { getResetEmail, setResetVerified } from '../../utils/passwordReset'
import { toastSuccess } from '../../stores/toast'
import OtpInput from './OtpInput.vue'
import AuthButton from './AuthButton.vue'

const router = useRouter()

const OTP_TTL_SECONDS = 5 * 60

const email = ref(getResetEmail())
const otp = ref('')
const otpError = ref('')
const formError = ref('')
const submitting = ref(false)
const resending = ref(false)

const secondsLeft = ref(OTP_TTL_SECONDS)
let timer: ReturnType<typeof setInterval> | null = null

const expired = computed(() => secondsLeft.value <= 0)

const countdown = computed(() => {
  const minutes = Math.floor(Math.max(0, secondsLeft.value) / 60)
  const seconds = Math.max(0, secondsLeft.value) % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function startTimer() {
  secondsLeft.value = OTP_TTL_SECONDS
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function validate() {
  if (otp.value.length !== 6) {
    otpError.value = 'Enter the 6-digit code'
    return false
  }
  otpError.value = ''
  return true
}

async function verifyOtp() {
  if (!email.value) {
    router.replace('/forgot-password')
    return
  }
  if (!validate()) return
  submitting.value = true
  formError.value = ''
  try {
    await apiVerifyOtp(email.value, otp.value)
    setResetVerified(otp.value)
    router.replace('/reset-password')
  } catch (e) {
    otpError.value = e instanceof Error ? e.message : 'Invalid or expired OTP'
  } finally {
    submitting.value = false
  }
}

async function resendOtp() {
  if (!email.value) return
  resending.value = true
  try {
    await apiSendOtp(email.value)
    otp.value = ''
    otpError.value = ''
    formError.value = ''
    startTimer()
    toastSuccess('A new verification code has been sent')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Unable to resend the code'
  } finally {
    resending.value = false
  }
}

onMounted(() => {
  if (!email.value) {
    router.replace('/forgot-password')
    return
  }
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="verifyOtp">
    <div class="flex items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-gray-50 px-4 py-3 dark:border-[#334155] dark:bg-[#0F172A]">
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#4F46E5]/10 text-[#4F46E5] dark:text-[#818CF8]">
        <Mail class="h-4 w-4" />
      </span>
      <p class="min-w-0 text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
        Code sent to
        <span class="font-semibold break-all text-[#111827] dark:text-[#F8FAFC]">{{ email }}</span>
      </p>
    </div>

    <div>
      <OtpInput
        v-model="otp"
        :error="otpError"
        :disabled="submitting"
        @update:model-value="otpError = ''"
      />
      <p
        v-if="otpError"
        class="mt-2 text-center text-xs font-medium text-[#EF4444]"
      >
        {{ otpError }}
      </p>
    </div>

    <div
      class="flex items-center justify-center gap-1.5 text-xs font-medium"
      :class="expired ? 'text-[#EF4444]' : 'text-[#64748B] dark:text-[#94A3B8]'"
    >
      <Clock class="h-3.5 w-3.5" />
      <span v-if="expired">OTP expired</span>
      <span v-else>OTP expires in {{ countdown }}</span>
    </div>

    <p
      v-if="formError"
      class="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3 text-xs leading-relaxed text-[#B91C1C] dark:border-[#EF4444]/40 dark:bg-[#EF4444]/10 dark:text-[#FCA5A5]"
    >
      {{ formError }}
    </p>

    <AuthButton :loading="submitting" loading-text="Verifying...">
      Verify OTP
    </AuthButton>

    <div class="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
      Didn't receive the code?
      <button
        type="button"
        class="inline-flex items-center gap-1 font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
        :disabled="!expired || resending"
        @click="resendOtp"
      >
        <TimerReset v-if="!resending" class="h-3.5 w-3.5" />
        <template v-if="resending">Sending...</template>
        <template v-else>Resend OTP</template>
      </button>
    </div>

    <RouterLink
      to="/login"
      class="block text-center text-sm font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
    >
      Remember your password? Login
    </RouterLink>
  </form>
</template>