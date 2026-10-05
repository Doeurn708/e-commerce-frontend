<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import ProductFilter, { type PriceRange } from '../components/ProductFilter.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'
import EmptyState from '../components/EmptyState.vue'
import { getCategory } from '../api/categories'
import { useCatalogStore } from '../stores/catalog'
import { imageUrl, onImageError } from '../utils/image'
import type { Category, Paginated, Product } from '../types'

const route = useRoute()
const catalog = useCatalogStore()

const category = ref<Category | null>(null)
const result = ref<Paginated<Product>>({ data: [], total: 0, page: 1, per_page: 12, last_page: 1 })

const search = ref('')
const priceRange = ref<PriceRange>('all')
const inStockOnly = ref(false)
const sortBy = ref<'latest' | 'price_asc' | 'price_desc' | 'popular'>('latest')
const currentPage = ref(1)
const loading = ref(false)
const error = ref('')

const activeCategoryId = computed(() => {
  const q = route.query.category as string | undefined
  if (!q) return null
  const byName = catalog.findCategory(q)
  return byName ? byName.id : Number(q) || null
})

/** The count comes from the paginator the server returned, not a local tally. */
const categoryCount = computed(() => result.value.total)

const browseCategories = computed(() =>
  catalog.categoriesWithCount.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    image: c.image,
    description: c.description,
    count: c.count,
  })),
)

async function loadCategory() {
  if (!activeCategoryId.value) {
    category.value = null
    result.value = { data: [], total: 0, page: 1, per_page: 12, last_page: 1 }
    return
  }
  loading.value = true
  error.value = ''
  try {
    category.value = await getCategory(activeCategoryId.value)
    await loadProducts(true)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load category'
  } finally {
    loading.value = false
  }
}

async function loadProducts(resetPage = false) {
  if (!activeCategoryId.value) return
  loading.value = true
  error.value = ''
  try {
    if (resetPage) currentPage.value = 1
    const minPrice =
      priceRange.value === '25to50' ? 25 : priceRange.value === '50to100' ? 50 : undefined
    const maxPrice =
      priceRange.value === 'under25' ? 25 : priceRange.value === '25to50' ? 50 : priceRange.value === '50to100' ? 100 : undefined
    const paginated = await catalog.loadCategoryProducts(activeCategoryId.value, {
      page: currentPage.value,
      per_page: 12,
      search: search.value.trim() || undefined,
      sort: sortBy.value,
      min_price: minPrice,
      max_price: maxPrice,
      in_stock: inStockOnly.value || undefined,
    })
    result.value = paginated
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load products'
  } finally {
    loading.value = false
  }
}

watch(() => route.query.category, () => {
  currentPage.value = 1
  search.value = ''
  loadCategory()
})

watch(priceRange, () => loadProducts(true))
watch(inStockOnly, () => loadProducts(true))
watch(sortBy, () => loadProducts(true))
watch(currentPage, () => loadProducts())

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadProducts(true), 350)
})

function clearFilters() {
  search.value = ''
  priceRange.value = 'all'
  inStockOnly.value = false
  sortBy.value = 'latest'
  currentPage.value = 1
  loadProducts()
}

onMounted(async () => {
  await catalog.loadCategories().catch(() => undefined)
  loadCategory()
})
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <div class="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-white md:p-12">
      <h1 class="text-3xl font-extrabold md:text-4xl">{{ $t('categories') }}</h1>
      <p class="mt-2 max-w-lg text-sm text-indigo-100">
        {{ $t('browseByCategory') }}
      </p>
      <span class="mt-5 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold backdrop-blur">
        {{ catalog.totalProducts }} {{ $t('products') }} · {{ catalog.categories.length }} {{ $t('categories') }}
      </span>
    </div>

    <h2 class="mt-12 mb-6 flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
      <span class="h-6 w-1.5 rounded-full bg-indigo-600"></span>
      {{ $t('browseCategories') }}
    </h2>
    <CategoryGrid :categories="browseCategories" :cols="6" />

    <div v-if="category" class="mt-14">
      <div class="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 md:flex-row md:items-center">
        <img :src="imageUrl(category.image)" :alt="category.name" class="h-32 w-32 shrink-0 rounded-2xl object-cover" @error="onImageError" />
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ category.name }}</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ category.description }}</p>
          <span class="mt-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            {{ categoryCount }} {{ $t('products') }}
          </span>
        </div>
        <div class="flex w-full flex-col gap-3 md:w-80">
          <SearchBar v-model="search" />
          <div class="flex gap-3">
            <select
              v-model="sortBy"
              class="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="latest">{{ $t('sortLatest') }}</option>
              <option value="price_asc">{{ $t('priceLowHigh') }}</option>
              <option value="price_desc">{{ $t('priceHighLow') }}</option>
              <option value="popular">{{ $t('popular') }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mt-8 grid gap-8 lg:grid-cols-4">
        <aside class="lg:col-span-1">
          <div class="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <ProductFilter
              :categories="browseCategories"
              :selected-category-ids="[category.id]"
              :price-range="priceRange"
              :in-stock="inStockOnly"
              @update:price-range="priceRange = $event"
              @update:in-stock="inStockOnly = $event"
              @clear="clearFilters"
            />
          </div>
        </aside>

        <div class="lg:col-span-3">
          <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">{{ result.total }} {{ $t('products') }}</p>

          <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div v-for="n in 6" :key="n" class="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
          </div>

          <EmptyState
            v-else-if="error"
            :title="$t('loadFailed')"
            :description="error"
            :action-label="$t('tryAgain')"
            @action="loadProducts"
          />

          <div v-else-if="result.data.length" class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <ProductCard v-for="product in result.data" :key="product.id" :product="product" />
          </div>

          <EmptyState
            v-else
            :title="$t('noProducts')"
            :description="$t('noProductsFound')"
            :action-label="$t('clearFilters')"
            @action="clearFilters"
          />

          <div v-if="!loading && !error && result.data.length" class="mt-10">
            <Pagination :current-page="currentPage" :total-pages="result.last_page" @update:page="currentPage = $event" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>