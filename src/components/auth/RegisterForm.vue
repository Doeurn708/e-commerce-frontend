<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Mail, UserRound } from '@lucide/vue'
import { useAuth } from '../../stores/auth'
import { googleAuthUrl } from '../../api/auth'
import { setPostAuthRedirect } from '../../utils/postAuthRedirect'
import { toastError, toastInfo, toastSuccess } from '../../stores/toast'
import AuthInput from './AuthInput.vue'
import PasswordInput from './PasswordInput.vue'
import PasswordStrength from './PasswordStrength.vue'
import AuthButton from './AuthButton.vue'
import AuthDivider from './AuthDivider.vue'
import SocialLoginButtons from './SocialLoginButtons.vue'

const route = useRoute()
const router = useRouter()
const { register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const acceptTerms = ref(false)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

function validate() {
  const next: Record<string, string> = {}
  if (!name.value.trim()) next.name = 'Full name is required'
  if (!email.value.trim()) next.email = 'Email address is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) next.email = 'Enter a valid email address'
  if (!password.value) next.password = 'Password is required'
  else if (password.value.length < 8) next.password = 'Password must contain at least 8 characters'
  else {
    if (!/[A-Z]/.test(password.value)) next.password = 'Password must contain an uppercase letter'
    else if (!/[0-9]/.test(password.value)) next.password = 'Password must contain a number'
  }
  if (!confirm.value) next.confirm = 'Please confirm your password'
  else if (confirm.value !== password.value) next.confirm = "Passwords don't match"
  if (!acceptTerms.value) next.terms = 'You must accept the Terms of Service and Privacy Policy'
  errors.value = next
  return Object.keys(next).length === 0
}

function clearError(field: string) {
  if (errors.value[field]) errors.value[field] = ''
}

function homeFor() {
  const redirect = route.query.redirect as string
  return redirect || '/home'
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const user = await register(name.value, email.value, password.value)
    toastSuccess(`Welcome, ${user.name}!`)
    router.push(homeFor())
  } catch (e) {
    toastError(e instanceof Error ? e.message : 'Unable to create account')
  } finally {
    submitting.value = false
  }
}

function onGoogle() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string') {
    setPostAuthRedirect(redirect)
  }
  window.location.href = googleAuthUrl()
}

function onGithub() {
  toastInfo('GitHub sign-in is not configured yet')
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <AuthInput
      id="reg-name"
      v-model="name"
      label="Full Name"
      placeholder="Enter your full name"
      autocomplete="name"
      required
      :error="errors.name"
      @update:model-value="clearError('name')"
      :icon="UserRound"
    />

    <AuthInput
      id="reg-email"
      v-model="email"
      label="Email"
      type="email"
      placeholder="Enter your email address"
      autocomplete="email"
      required
      :error="errors.email"
      @update:model-value="clearError('email')"
      :icon="Mail"
    />

    <PasswordInput
      id="reg-password"
      v-model="password"
      label="Password"
      placeholder="Create a password"
      autocomplete="new-password"
      required
      :error="errors.password"
      @update:model-value="clearError('password')"
    />
    <PasswordStrength :value="password" />

    <PasswordInput
      id="reg-confirm"
      v-model="confirm"
      label="Confirm Password"
      placeholder="Confirm your password"
      autocomplete="new-password"
      required
      :error="errors.confirm"
      @update:model-value="clearError('confirm')"
    />

    <div>
      <label class="flex cursor-pointer select-none items-start gap-2.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
        <input
          v-model="acceptTerms"
          type="checkbox"
          class="mt-0.5 h-4 w-4 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] dark:border-[#334155] dark:bg-[#1E293B] dark:checked:bg-[#4F46E5]"
          aria-label="I agree to the Terms of Service and Privacy Policy"
        />
        <span class="leading-relaxed">
          I agree to the
          <a href="#" class="font-semibold text-[#4F46E5] hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]" @click.prevent>
            Terms of Service
          </a>
          and
          <a href="#" class="font-semibold text-[#4F46E5] hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]" @click.prevent>
            Privacy Policy
          </a>
        </span>
      </label>
      <p v-if="errors.terms" class="mt-1.5 text-xs font-medium text-[#EF4444]">{{ errors.terms }}</p>
    </div>

    <AuthButton :loading="submitting" loading-text="Creating account...">
      Create Account
    </AuthButton>

    <AuthDivider />

    <SocialLoginButtons @google="onGoogle" @github="onGithub" />

    <p class="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
      Already have an account?
      <RouterLink
        to="/login"
        class="font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
      >
        Sign in
      </RouterLink>
    </p>
  </form>
</template>