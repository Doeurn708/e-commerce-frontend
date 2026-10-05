<script setup lang="ts">
import AuthLayout from '../components/auth/AuthLayout.vue'
import VerifyOtpForm from '../components/auth/VerifyOtpForm.vue'
</script>

<template>
  <AuthLayout
    title="Verify OTP"
    subtitle="Enter the 6-digit verification code sent to your email address."
  >
    <VerifyOtpForm />
  </AuthLayout>
</template>