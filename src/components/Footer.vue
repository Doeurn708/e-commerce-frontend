<template>
  <footer class="border-t border-gray-200 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <img src="/image/image.png" alt="Chandoeurn Logo" class="h-9 w-auto object-contain" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('heroSubtitle') }}
        </p>
      </div>
      <div>
        <h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{{ $t('shop') }}</h4>
        <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li><RouterLink to="/shop" class="transition hover:text-indigo-600">{{ $t('products') }}</RouterLink></li>
          <li><RouterLink to="/categories" class="transition hover:text-indigo-600">{{ $t('categories') }}</RouterLink></li>
          <li><RouterLink to="/shop?sort=rating" class="transition hover:text-indigo-600">Best Sellers</RouterLink></li>
        </ul>
      </div>
      <div>
        <h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Support</h4>
        <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li><RouterLink to="/about" class="transition hover:text-indigo-600">{{ $t('about') }}</RouterLink></li>
          <li><RouterLink to="/account" class="transition hover:text-indigo-600">{{ $t('account') }}</RouterLink></li>
          <li><RouterLink to="/cart" class="transition hover:text-indigo-600">{{ $t('cart') }}</RouterLink></li>
        </ul>
      </div>
      <div>
        <h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Follow Us</h4>
        <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li><a href="#" class="transition hover:text-indigo-600">Facebook</a></li>
          <li><a href="#" class="transition hover:text-indigo-600">Instagram</a></li>
          <li><a href="#" class="transition hover:text-indigo-600">Twitter</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
      &copy; {{ new Date().getFullYear() }} Chandoeurn. All rights reserved.
    </div>
  </footer>
</template>