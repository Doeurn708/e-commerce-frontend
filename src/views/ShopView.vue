<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { SlidersHorizontal, X, ShoppingBag } from '@lucide/vue'
import ProductCard from '../components/ProductCard.vue'
import ProductFilter, { type PriceRange } from '../components/ProductFilter.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'
import EmptyState from '../components/EmptyState.vue'
import { getProducts } from '../api/products'
import { useCatalogStore } from '../stores/catalog'
import type { Paginated, Product } from '../types'

type SortOption = 'latest' | 'price_asc' | 'price_desc' | 'popular'

const route = useRoute()
const catalog = useCatalogStore()

const search = ref((route.query.q as string) || '')
const selectedCategoryIds = ref<number[]>([])
const priceRange = ref<PriceRange>('all')
const inStockOnly = ref(false)
const sortBy = ref<SortOption>('latest')
const currentPage = ref(1)
const pageSize = 12

const loading = ref(false)
const error = ref('')

const result = ref<Paginated<Product>>({ data: [], total: 0, page: 1, per_page: 12, last_page: 1 })

// Counts and names come from GET /api/categories.
const filterCategoryIds = computed(() =>
  catalog.categoriesWithCount.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count })),
)

const filterCount = computed(
  () => selectedCategoryIds.value.length + (priceRange.value !== 'all' ? 1 : 0) + (inStockOnly.value ? 1 : 0),
)

const mobileOpen = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const minPrice =
      priceRange.value === '25to50' ? 25 : priceRange.value === '50to100' ? 50 : undefined
    const maxPrice =
      priceRange.value === 'under25' ? 25 : priceRange.value === '25to50' ? 50 : priceRange.value === '50to100' ? 100 : undefined
    const params = {
      page: currentPage.value,
      per_page: pageSize,
      search: search.value.trim() || undefined,
      sort: sortBy.value,
      category_id: selectedCategoryIds.value.length === 1 ? selectedCategoryIds.value[0] : undefined,
      min_price: minPrice,
      max_price: maxPrice,
      in_stock: inStockOnly.value || undefined,
    }
    result.value = await getProducts(params)
    // Feed the shared catalog so the cart can resolve these rows by id.
    catalog.mergeProducts(result.value.data)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load products'
  } finally {
    loading.value = false
    mobileOpen.value = false
  }
}

watch(selectedCategoryIds, () => {
  currentPage.value = 1
  load()
})
watch(priceRange, () => {
  currentPage.value = 1
  load()
})
watch(inStockOnly, () => {
  currentPage.value = 1
  load()
})
watch(sortBy, () => {
  currentPage.value = 1
  load()
})

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    load()
  }, 350)
})

watch(currentPage, load)

onMounted(async () => {
  await catalog.loadCategories().catch(() => undefined)

  const q = route.query.category as string | undefined
  if (q) {
    const cat = catalog.findCategory(q)
    if (cat?.id) selectedCategoryIds.value = [cat.id]
  }
  load()
})

function clearFilters() {
  selectedCategoryIds.value = []
  priceRange.value = 'all'
  inStockOnly.value = false
  sortBy.value = 'latest'
  search.value = ''
  currentPage.value = 1
  load()
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-12">
    <div class="mb-8 flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('allProducts') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ result.total }} {{ $t('products') }}
          </p>
        </div>
        <div class="flex w-full items-center gap-3 md:w-auto">
          <div class="flex-1 md:w-72 md:flex-none">
            <SearchBar v-model="search" />
          </div>
          <select
            v-model="sortBy"
            class="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          >
            <option value="latest">{{ $t('sortLatest') }}</option>
            <option value="price_asc">{{ $t('priceLowHigh') }}</option>
            <option value="price_desc">{{ $t('priceHighLow') }}</option>
            <option value="popular">{{ $t('popular') }}</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-600 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 lg:hidden"
        @click="mobileOpen = true"
      >
        <SlidersHorizontal class="h-4 w-4" />
        {{ $t('filters') }}
        <span v-if="filterCount" class="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">{{ filterCount }}</span>
      </button>
    </div>

    <div class="grid gap-8 lg:grid-cols-4">
      <aside class="hidden lg:col-span-1 lg:block">
        <div class="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <ProductFilter
            :categories="filterCategoryIds"
            :selected-category-ids="selectedCategoryIds"
            :price-range="priceRange"
            :in-stock="inStockOnly"
            @update:selected-category-ids="selectedCategoryIds = $event"
            @update:price-range="priceRange = $event"
            @update:in-stock="inStockOnly = $event"
            @clear="clearFilters"
          />
        </div>
      </aside>

      <div class="lg:col-span-3">
        <div v-if="loading" class="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="n in 8"
            :key="n"
            class="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
          ></div>
        </div>

        <EmptyState
          v-else-if="error"
          :title="$t('loadFailed')"
          :description="error"
          :action-label="$t('tryAgain')"
          @action="load"
        />

        <div v-else-if="result.data.length" class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <ProductCard v-for="product in result.data" :key="product.id" :product="product" />
        </div>

        <EmptyState
          v-else
          :icon="ShoppingBag"
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

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" @click="mobileOpen = false"></div>
      </Transition>
      <Transition
        enter-active-class="transition-transform duration-300"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div v-if="mobileOpen" class="fixed right-0 top-0 z-[80] h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-2xl dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('filters') }}</h2>
            <button type="button" class="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800" :aria-label="$t('close')" @click="mobileOpen = false">
              <X class="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <ProductFilter
            :categories="filterCategoryIds"
            :selected-category-ids="selectedCategoryIds"
            :price-range="priceRange"
            :in-stock="inStockOnly"
            @update:selected-category-ids="selectedCategoryIds = $event"
            @update:price-range="priceRange = $event"
            @update:in-stock="inStockOnly = $event"
            @clear="clearFilters"
          />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>