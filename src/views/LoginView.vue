<script setup lang="ts">
import AuthLayout from '../components/auth/AuthLayout.vue'
import LoginForm from '../components/auth/LoginForm.vue'
</script>

<template>
  <AuthLayout
    title="Welcome Back"
    subtitle="Sign in to your account to continue shopping."
  >
    <LoginForm />

    <template #extras>
      <p class="text-xs leading-relaxed text-[#94A3B8]">
        Demo accounts &mdash;
        Admin: <span class="font-medium text-[#64748B] dark:text-[#94A3B8]">admin@example.com / Admin@123</span>
        &middot; Customer:
        <span class="font-medium text-[#64748B] dark:text-[#94A3B8]">user@example.com / User@123</span>
      </p>
    </template>
  </AuthLayout>
</template>