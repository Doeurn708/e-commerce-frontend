<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Mail } from '@lucide/vue'
import { useAuth } from '../../stores/auth'
import { googleAuthUrl } from '../../api/auth'
import { setPostAuthRedirect } from '../../utils/postAuthRedirect'
import { toastError, toastInfo, toastSuccess } from '../../stores/toast'
import AuthInput from './AuthInput.vue'
import PasswordInput from './PasswordInput.vue'
import AuthButton from './AuthButton.vue'
import AuthDivider from './AuthDivider.vue'
import SocialLoginButtons from './SocialLoginButtons.vue'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const remember = ref(true)
const errors = ref<{ email?: string; password?: string }>({})
const submitting = ref(false)

function validate() {
  const next: { email?: string; password?: string } = {}
  if (!email.value.trim()) {
    next.email = 'Email address is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    next.email = 'Enter a valid email address'
  }
  if (!password.value) {
    next.password = 'Password is required'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function homeFor(role: 'admin' | 'customer') {
  const redirect = route.query.redirect as string
  if (redirect) return redirect
  return role === 'admin' ? '/admin/overview' : '/home'
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const user = await login(email.value, password.value)
    toastSuccess(`Welcome back, ${user.name}!`)
    router.push(homeFor(user.role))
  } catch (e) {
    toastError(e instanceof Error ? e.message : 'Unable to sign in')
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
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <AuthInput
      id="login-email"
      v-model="email"
      label="Email"
      type="email"
      placeholder="Email address"
      autocomplete="email"
      required
      :error="errors.email"
      :icon="Mail"
    />

    <PasswordInput
      id="login-password"
      v-model="password"
      label="Password"
      placeholder="Password"
      autocomplete="current-password"
      required
      :error="errors.password"
      @update:model-value="errors.password = ''"
    />

    <div class="flex items-center justify-between">
      <label class="flex cursor-pointer select-none items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
        <input
          v-model="remember"
          type="checkbox"
          class="h-4 w-4 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] dark:border-[#334155] dark:bg-[#1E293B] dark:checked:bg-[#4F46E5]"
          aria-label="Remember me"
        />
        Remember me
      </label>

      <RouterLink
        to="/forgot-password"
        class="text-sm font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
      >
        Forgot password?
      </RouterLink>
    </div>

    <AuthButton :loading="submitting" loading-text="Signing in...">
      Sign In
    </AuthButton>

    <AuthDivider />

    <SocialLoginButtons @google="onGoogle" />

    <p class="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
      Don't have an account?
      <RouterLink
        to="/register"
        class="font-semibold text-[#4F46E5] transition-colors hover:text-[#4338CA] dark:text-[#818CF8] dark:hover:text-[#A5B4FC]"
      >
        Create account
      </RouterLink>
    </p>
  </form>
</template>