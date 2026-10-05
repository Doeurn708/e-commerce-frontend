<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ArrowRight } from '@lucide/vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import ProductGrid from '../components/ProductGrid.vue'
import TrendingProducts from '../components/TrendingProducts.vue'
import Newsletter from '../components/Newsletter.vue'
import HeroBanner from '../components/HeroBanner.vue'
import { useCatalogStore } from '../stores/catalog'

const catalog = useCatalogStore()
const {
  categories,
  categoriesWithCount,
  products,
  productsLoading,
  trendingProducts,
  trendingLoading,
  trendingError,
} = catalog

onMounted(async () => {
  // The hero renders immediately; the catalog streams in behind it.
  // loadTrendingProducts swallows its own error so a trending failure never
  // blocks the categories and the product sections.
  await Promise.allSettled([
    catalog.loadCategories(),
    catalog.loadProducts({ per_page: 12 }),
    catalog.loadTrendingProducts(),
  ])
})

// "Featured" = first page from the API, "latest" = the tail of the same page.
// Trending is its own server-ranked query and is rendered by <TrendingProducts>.
const featuredProducts = computed(() => products.slice(0, 4))
const latestProducts = computed(() => [...products].slice(-4).reverse())

const categoryStats = computed(() => categoriesWithCount)
</script>

<template>
  <div>
    <!--
      Same trending array the section below renders, so the banner artwork is
      the real #1 product rather than stock photography.
    -->
    <HeroBanner :products="trendingProducts" />

    <section class="mx-auto max-w-7xl px-4 py-16">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h2 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
            <span class="h-6 w-1.5 rounded-full bg-indigo-600"></span>
            {{ $t('browseCategories') }}
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Explore our collections</p>
        </div>
        <RouterLink to="/categories" class="hidden items-center gap-1 text-sm font-semibold text-indigo-600 hover:gap-2 transition-all sm:flex dark:text-indigo-400">
          {{ $t('viewAll') }} <ArrowRight class="h-4 w-4" />
        </RouterLink>
      </div>
      <CategoryGrid :categories="categoryStats" :cols="6" />
    </section>

    <ProductGrid title-key="featuredProducts" :products="featuredProducts" :loading="productsLoading" />

    <!--
      Scroll target for the hero's "Explore Trending" CTA. The id lives here,
      on the page that owns the layout, so TrendingProducts.vue stays a plain
      presentational component. scroll-mt clears the sticky navbar.
    -->
    <div id="trending-products" class="scroll-mt-24">
      <TrendingProducts
        :products="trendingProducts"
        :loading="trendingLoading"
        :error="trendingError"
        @retry="catalog.loadTrendingProducts(true)"
      />
    </div>

    <section class="bg-white py-16 transition-colors dark:bg-gray-900/40">
      <ProductGrid title-key="latestProducts" :products="latestProducts" :loading="productsLoading" />
    </section>

    <Newsletter />
  </div>
</template>