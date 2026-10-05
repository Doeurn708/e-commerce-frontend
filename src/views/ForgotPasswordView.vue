<script setup lang="ts">
import AuthLayout from '../components/auth/AuthLayout.vue'
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm.vue'
</script>

<template>
  <AuthLayout
    title="Forgot Password?"
    subtitle="Enter your email address and we'll send you a verification code to reset your password."
  >
    <ForgotPasswordForm />
  </AuthLayout>
</template>