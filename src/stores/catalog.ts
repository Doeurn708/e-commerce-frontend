import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { getCategories, getCategoryProducts } from '../api/categories'
import { getProducts, getTrendingProducts } from '../api/products'
import type { Category, Paginated, Product, ProductQuery } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Catalog store
 * ---------------------------------------------------------------------------
 * Backing cache for the public storefront. It exists so the home page, the
 * category grid, the cart and the wishlist can all resolve a product by id
 * without each of them re-fetching the same rows.
 *
 * Everything here comes from Laravel/PostgreSQL through src/api/*. There is no
 * seeded data anywhere in this file.
 */

const PRODUCTS_PER_PAGE = 12

/** The home page trending section never shows more than this. */
const TRENDING_LIMIT = 8

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])

  /**
   * Trending rows are kept apart from `products` on purpose: they come from a
   * different, server-ranked query, so mixing them into the main list would
   * corrupt the "latest arrivals" ordering the other home sections rely on.
   */
  const trendingProducts = ref<Product[]>([])

  const productsLoading = ref(false)
  const categoriesLoading = ref(false)
  const productsError = ref('')
  const categoriesError = ref('')
  const trendingLoading = ref(false)
  const trendingError = ref('')

  const totalProducts = ref(0)

  let productsLoaded = false
  let categoriesLoaded = false
  let trendingLoaded = false

  /** Freshest rows fetched for the storefront, used as a lookup table. */
  const productById = computed(() => new Map(products.value.map((p) => [p.id, p])))

  const categoryById = computed(() => new Map(categories.value.map((c) => [c.id, c])))

  const categoryBySlug = computed(() => new Map(categories.value.map((c) => [c.slug, c])))

  /** Categories for the sidebar / grid, with the product count the API reports. */
  const categoriesWithCount = computed(() =>
    categories.value.map((c) => ({ ...c, count: c.products_count ?? c.products?.length ?? 0 })),
  )

  function findProduct(id: number | string): Product | undefined {
    const numericId = Number(id)
    if (Number.isFinite(numericId)) return productById.value.get(numericId)
    return products.value.find((p) => p.slug === String(id))
  }

  function findCategory(idOrSlug: number | string): Category | undefined {
    const numericId = Number(idOrSlug)
    if (Number.isFinite(numericId) && categoryById.value.has(numericId)) {
      return categoryById.value.get(numericId)
    }
    return categoryBySlug.value.get(String(idOrSlug)) ?? categories.value.find((c) => c.name === String(idOrSlug))
  }

  /**
   * Load (or refresh) the storefront product list. `force` bypasses the
   * "already loaded" short circuit used on repeated navigations.
   */
  async function loadProducts(query: ProductQuery = {}, force = false): Promise<Paginated<Product>> {
    if (productsLoaded && !force) {
      return {
        data: products.value,
        total: totalProducts.value,
        page: 1,
        per_page: PRODUCTS_PER_PAGE,
        last_page: Math.max(1, Math.ceil(totalProducts.value / PRODUCTS_PER_PAGE)),
      }
    }

    productsLoading.value = true
    productsError.value = ''

    try {
      const page = await getProducts({ per_page: PRODUCTS_PER_PAGE, ...query })
      products.value = page.data
      totalProducts.value = page.total
      productsLoaded = true
      return page
    } catch (e) {
      productsError.value = e instanceof Error ? e.message : 'Failed to load products'
      throw e instanceof Error ? e : new Error(productsError.value)
    } finally {
      productsLoading.value = false
    }
  }

  async function loadCategories(force = false): Promise<Category[]> {
    if (categoriesLoaded && !force) return categories.value

    categoriesLoading.value = true
    categoriesError.value = ''

    try {
      categories.value = await getCategories()
      categoriesLoaded = true
      return categories.value
    } catch (e) {
      categoriesError.value = e instanceof Error ? e.message : 'Failed to load categories'
      throw e instanceof Error ? e : new Error(categoriesError.value)
    } finally {
      categoriesLoading.value = false
    }
  }

  /**
   * Best sellers for the home page. This never throws into the caller: the
   * section shows an inline error state instead, so one failing request cannot
   * take down the rest of the page. `force` refetches on repeat visits.
   */
  async function loadTrendingProducts(force = false): Promise<Product[]> {
    if (trendingLoaded && !force) return trendingProducts.value

    trendingLoading.value = true
    trendingError.value = ''

    try {
      trendingProducts.value = await getTrendingProducts(TRENDING_LIMIT)
      trendingLoaded = true
      return trendingProducts.value
    } catch (e) {
      trendingError.value = e instanceof Error ? e.message : 'Failed to load trending products'
      return []
    } finally {
      trendingLoading.value = false
    }
  }

  /**
   * Products for a category, merged into the shared lookup so a cart item
   * added from the category page can still be priced in the cart.
   */
  async function loadCategoryProducts(
    categoryId: number | string,
    query: ProductQuery = {},
  ): Promise<Paginated<Product>> {
    categoriesLoading.value = true
    categoriesError.value = ''

    try {
      const { category, paginated } = await getCategoryProducts(categoryId, {
        per_page: PRODUCTS_PER_PAGE,
        ...query,
      })

      if (category?.id) {
        const existing = categories.value.findIndex((c) => c.id === category.id)
        if (existing === -1) categories.value.push(category)
        else categories.value[existing] = category
      }

      mergeProducts(paginated.data)

      return paginated
    } catch (e) {
      categoriesError.value = e instanceof Error ? e.message : 'Failed to load products'
      throw e instanceof Error ? e : new Error(categoriesError.value)
    } finally {
      categoriesLoading.value = false
    }
  }

  /** Upsert rows into the lookup without dropping what is already cached. */
  function mergeProducts(incoming: Product[]): void {
    for (const product of incoming) {
      const index = products.value.findIndex((p) => p.id === product.id)
      if (index === -1) products.value.push(product)
      else products.value[index] = product
    }
  }

  /** Drop a deleted product so the cart and wishlist stop resolving it. */
  function removeProduct(id: number | string): void {
    products.value = products.value.filter((p) => p.id !== Number(id))
  }

  function reset(): void {
    products.value = []
    categories.value = []
    trendingProducts.value = []
    totalProducts.value = 0
    productsLoaded = false
    categoriesLoaded = false
    trendingLoaded = false
    productsError.value = ''
    categoriesError.value = ''
    trendingError.value = ''
  }

  return {
    // state
    products,
    categories,
    trendingProducts,
    productsLoading,
    categoriesLoading,
    productsError,
    categoriesError,
    trendingLoading,
    trendingError,
    totalProducts,
    // getters
    productById,
    categoryById,
    categoryBySlug,
    categoriesWithCount,
    // actions
    loadProducts,
    loadCategories,
    loadTrendingProducts,
    loadCategoryProducts,
    mergeProducts,
    removeProduct,
    findProduct,
    findCategory,
    reset,
  }
})

export function useCatalog() {
  const store = useCatalogStore()
  const {
    products,
    categories,
    trendingProducts,
    productsLoading,
    categoriesLoading,
    productsError,
    categoriesError,
    trendingLoading,
    trendingError,
    totalProducts,
    categoriesWithCount,
  } = storeToRefs(store)

  return {
    products,
    categories,
    trendingProducts,
    categoriesWithCount,
    productsLoading,
    categoriesLoading,
    productsError,
    categoriesError,
    trendingLoading,
    trendingError,
    totalProducts,
    loadProducts: store.loadProducts,
    loadCategories: store.loadCategories,
    loadTrendingProducts: store.loadTrendingProducts,
    loadCategoryProducts: store.loadCategoryProducts,
    findProduct: store.findProduct,
    findCategory: store.findCategory,
  }
}
