<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { readGoogleCallbackParams } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { takePostAuthRedirect } from '../utils/postAuthRedirect'

const router = useRouter()
const auth = useAuthStore()

const error = ref('')

onMounted(async () => {
  const { token, user, error: callbackError } = readGoogleCallbackParams()

  if (callbackError) {
    error.value = callbackError
    return
  }

  if (!token || !user) {
    error.value = 'Google sign-in did not return a valid session.'
    return
  }

  try {
    const session = await auth.loginWithToken(token, user)
    router.replace(takePostAuthRedirect(session.role === 'admin' ? '/admin/overview' : '/home'))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Google sign-in failed.'
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
    <template v-if="!error">
      <span
        class="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400">Completing Google sign-in...</p>
    </template>

    <template v-else>
      <p class="text-sm font-medium text-red-600 dark:text-red-400">{{ error }}</p>
      <RouterLink
        to="/login"
        class="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Back to Login
      </RouterLink>
    </template>
  </div>
</template>
