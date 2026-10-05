<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, RotateCcw } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getAdminProducts, deleteProduct } from '../../api/products'
import { getCategories } from '../../api/categories'
import ProductTable from '../../components/admin/ProductTable.vue'
import SearchInput from '../../components/admin/SearchInput.vue'
import FilterSelect from '../../components/admin/FilterSelect.vue'
import ConfirmModal from '../../components/admin/ConfirmModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusBadge from '../../components/admin/StatusBadge.vue'
import { formatMoney, formatDateTime } from '../../utils/format'
import { imageUrl, onImageError } from '../../utils/image'
import type { Category, Product } from '../../types'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const lastPage = ref(1)

const filters = reactive<{
  search: string
  category_id: string
  stock: string
  status: string
  sort: string
}>({
  search: '',
  category_id: '',
  stock: '',
  status: '',
  sort: 'latest',
})

const deleting = ref<Product | null>(null)
const deleteLoading = ref(false)
const viewProduct = ref<Product | null>(null)

const feedback = ref('')
const feedbackError = ref(false)

function showFeedback(message: string, isError = false) {
  feedback.value = message
  feedbackError.value = isError
  setTimeout(() => {
    feedback.value = ''
  }, 3000)
}

async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await getAdminProducts({
      search: filters.search || undefined,
      category_id: filters.category_id ? Number(filters.category_id) : undefined,
      stock: (filters.stock as 'in' | 'out' | undefined) || undefined,
      status: (filters.status as 'active' | 'inactive' | undefined) || undefined,
      sort: (filters.sort as 'latest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'),
      page: page.value,
      per_page: perPage.value,
    })
    products.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    page.value = result.page
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function resetPageAndLoad() {
  page.value = 1
  load()
}

watch([filters, perPage], resetPageAndLoad)

onMounted(() => {
  loadCategories()
  load()
})

function clearFilters() {
  filters.search = ''
  filters.category_id = ''
  filters.stock = ''
  filters.status = ''
  filters.sort = 'latest'
  page.value = 1
  load()
}

const hasFilters = computed(
  () => !!(filters.search || filters.category_id || filters.stock || filters.status),
)

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: String(c.id), label: c.name })),
)

async function onDeleteConfirmed() {
  if (!deleting.value) return
  deleteLoading.value = true
  try {
    await deleteProduct(deleting.value.id)
    showFeedback(t('productDeletedMsg'))
    deleting.value = null
    if (products.value.length === 1 && page.value > 1) page.value -= 1
    load()
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('productsTitle') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('itemsCount', { n: total }) }}
        </p>
      </div>
      <RouterLink
        to="/admin/products/create"
        class="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
      >
        <Plus class="h-4 w-4" />
        {{ $t('addProduct') }}
      </RouterLink>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl border px-4 py-3 text-sm font-medium"
      :class="feedbackError
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'"
    >
      {{ feedback }}
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          v-model="filters.search"
          :placeholder="t('searchProducts')"
          :aria-label="t('searchProducts')"
        />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:flex-none">
          <FilterSelect
            v-model="filters.category_id"
            :options="categoryOptions"
            :all-label="t('allCategories')"
            :aria-label="t('categories')"
          />
          <FilterSelect
            v-model="filters.stock"
            :options="[
              { value: 'in', label: t('onlyInStock') },
              { value: 'out', label: t('onlyOutOfStock') },
            ]"
            :all-label="t('anyStock')"
            :aria-label="t('stockHeader')"
          />
          <FilterSelect
            v-model="filters.status"
            :options="[
              { value: 'active', label: t('activeProducts') },
              { value: 'inactive', label: t('inactiveProducts') },
            ]"
            :all-label="t('allStatuses')"
            :aria-label="t('status')"
          />
          <FilterSelect
            v-model="filters.sort"
            :options="[
              { value: 'name_asc', label: t('sortNameAZ') },
              { value: 'name_desc', label: t('sortNameZA') },
              { value: 'price_asc', label: t('priceLowHigh') },
              { value: 'price_desc', label: t('priceHighLow') },
            ]"
            :all-label="t('sortLatest')"
            :aria-label="t('sortBy')"
          />
        </div>
        <button
          v-if="hasFilters"
          type="button"
          class="flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          @click="clearFilters"
        >
          <RotateCcw class="h-4 w-4" />
          {{ $t('clear') }}
        </button>
      </div>
    </div>

    <ProductTable
      :products="products"
      :loading="loading"
      :error="error"
      @retry="load"
      @view="viewProduct = $event"
      @edit="router.push(`/admin/products/${$event.id}/edit`)"
      @delete="deleting = $event"
    />

    <Pagination
      :current-page="page"
      :total-pages="lastPage"
      :total="total"
      :per-page="perPage"
      :summary-text="t('showingSummary')"
      @update:page="page = $event; load()"
      @update:per-page="perPage = $event"
    />

    <ConfirmModal
      :open="!!deleting"
      :title="t('deleteProduct')"
      :message="t('deleteProductMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      :loading="deleteLoading"
      @confirm="onDeleteConfirmed"
      @cancel="deleting = null"
    />

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="viewProduct"
          class="fixed inset-0 z-[70] flex items-center justify-center p-4"
          @click.self="viewProduct = null"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div
            class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('productDetails') }}</h3>
            <div class="mt-4 space-y-3 text-sm">
              <div class="flex items-center gap-3">
                <img
                  v-if="viewProduct.image"
                  :src="imageUrl(viewProduct.image)"
                  :alt="viewProduct.name"
                  class="h-16 w-16 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                  @error="onImageError"
                />
                <div v-else class="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                  —
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ viewProduct.name }}</p>
                  <p class="text-xs text-gray-400">{{ viewProduct.slug }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">ID</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ viewProduct.id }}</p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('categories') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ viewProduct.category?.name ?? '—' }}
                  </p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('price') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ formatMoney(viewProduct.price) }}
                  </p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('stockHeader') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ viewProduct.stock }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('status') }}</p>
                <StatusBadge :value="viewProduct.stock > 0 ? 'active' : 'inactive'" />
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('created') }}</p>
                <p class="text-xs text-gray-700 dark:text-gray-300">
                  {{ formatDateTime(viewProduct.created_at) }}
                </p>
              </div>
              <div v-if="viewProduct.description" class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">{{ t('description') }}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ viewProduct.description }}</p>
              </div>
            </div>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                @click="viewProduct = null"
              >
                {{ t('close') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                @click="router.push(`/admin/products/${viewProduct.id}/edit`)"
              >
                {{ t('edit') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>