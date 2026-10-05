<script setup lang="ts">
import AuthLayout from '../components/auth/AuthLayout.vue'
import ResetPasswordForm from '../components/auth/ResetPasswordForm.vue'
</script>

<template>
  <AuthLayout
    title="Reset Password"
    subtitle="Create a new password for your account."
  >
    <ResetPasswordForm />
  </AuthLayout>
</template>