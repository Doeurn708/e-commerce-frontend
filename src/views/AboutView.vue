<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{{ $t('about') }}</h1>

    <div class="grid gap-10 lg:grid-cols-2">
      <div>
        <h2 class="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Our Story</h2>
        <p class="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">
          Founded in 2020, LOGO started with a simple mission: make great products accessible to
          everyone. What began as a small online store has grown into a marketplace loved by
          thousands of customers worldwide.
        </p>
        <p class="leading-relaxed text-gray-600 dark:text-gray-300">
          We partner with trusted brands and independent makers to bring you a curated selection of
          Fashion, Electronics, Shoes, Beauty and more — always at fair prices.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div v-for="stat in stats" :key="stat.label" class="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
          <p class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{{ stat.value }}</p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <h2 class="mt-16 mb-8 text-2xl font-bold text-gray-900 dark:text-white">Our Values</h2>
    <div class="grid gap-6 sm:grid-cols-3">
      <div v-for="v in values" :key="v.title" class="rounded-2xl bg-gray-50 p-6 transition hover:shadow-lg dark:bg-gray-900">
        <h3 class="mb-2 font-semibold text-gray-800 dark:text-gray-100">{{ v.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ v.text }}</p>
      </div>
    </div>

    <div class="mt-16 text-center">
      <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>
      <p class="mb-6 text-gray-500 dark:text-gray-400">Questions? We'd love to hear from you.</p>
      <RouterLink
        to="/shop"
        class="inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
      >
        {{ $t('shopNow') }}
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '10K+', label: 'Products' },
  { value: '120+', label: 'Brands' },
  { value: '4.8', label: 'Average Rating' },
]

const values = [
  { title: 'Quality', text: 'Every product is hand-picked and quality-checked before it ships.' },
  { title: 'Affordability', text: 'We negotiate with suppliers so you always get the best price.' },
  { title: 'Service', text: 'Fast shipping, easy returns, and support that actually helps.' },
]
</script>