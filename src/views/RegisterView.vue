<script setup lang="ts">
import AuthLayout from '../components/auth/AuthLayout.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'
</script>

<template>
  <AuthLayout
    title="Create Account"
    subtitle="Create your account and start shopping today."
  >
    <RegisterForm />
  </AuthLayout>
</template>