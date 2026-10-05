<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, RotateCcw } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getAdminCategories, deleteCategory } from '../../api/categories'
import { getCategoryProducts } from '../../api/orders'
import CategoryTable from '../../components/admin/CategoryTable.vue'
import SearchInput from '../../components/admin/SearchInput.vue'
import FilterSelect from '../../components/admin/FilterSelect.vue'
import ConfirmModal from '../../components/admin/ConfirmModal.vue'
import Pagination from '../../components/Pagination.vue'
import { formatMoney } from '../../utils/format'
import type { Category, Product } from '../../types'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const lastPage = ref(1)

const filters = reactive<{
  search: string
  sort: string
}>({
  search: '',
  sort: 'latest',
})

const deleting = ref<Category | null>(null)
const deleteLoading = ref(false)

const viewCategory = ref<Category | null>(null)
const viewProducts = ref<Product[]>([])
const viewLoading = ref(false)

const feedback = ref('')
const feedbackError = ref(false)

function showFeedback(message: string, isError = false) {
  feedback.value = message
  feedbackError.value = isError
  setTimeout(() => {
    feedback.value = ''
  }, 3000)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await getAdminCategories({
      search: filters.search || undefined,
      sort: (filters.sort as 'latest' | 'name' | 'products') || undefined,
      page: page.value,
      per_page: perPage.value,
    })
    categories.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    page.value = result.page
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
    categories.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch([filters, perPage], () => {
  page.value = 1
  load()
})

onMounted(load)

const hasFilters = computed(() => !!filters.search || filters.sort !== 'latest')

function clearFilters() {
  filters.search = ''
  filters.sort = 'latest'
  page.value = 1
  load()
}

async function openView(category: Category) {
  viewCategory.value = category
  viewLoading.value = true
  viewProducts.value = []
  try {
    const result = await getCategoryProducts(category.id, { per_page: 100 })
    viewProducts.value = result.paginated.data
  } catch {
    viewProducts.value = []
  } finally {
    viewLoading.value = false
  }
}

async function onDeleteConfirmed() {
  if (!deleting.value) return
  deleteLoading.value = true
  try {
    await deleteCategory(deleting.value.id)
    showFeedback(t('categoryDeletedMsg'))
    deleting.value = null
    if (categories.value.length === 1 && page.value > 1) page.value -= 1
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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('categories') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('itemsCount', { n: total }) }}
        </p>
      </div>
      <RouterLink
        to="/admin/categories/create"
        class="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
      >
        <Plus class="h-4 w-4" />
        {{ $t('addCategory') }}
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
          :placeholder="t('search')"
          :aria-label="t('search')"
        />
        <div class="lg:w-56 lg:flex-none">
          <FilterSelect
            v-model="filters.sort"
            :options="[
              { value: 'name', label: t('sortNameAZ') },
              { value: 'products', label: t('productsCount') },
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

    <CategoryTable
      :categories="categories"
      :loading="loading"
      :error="error"
      @retry="load"
      @view="openView"
      @edit="router.push(`/admin/categories/${$event.id}/edit`)"
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
      :title="t('deleteCategory')"
      :message="t('deleteCategoryMessage')"
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
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="viewCategory"
          class="fixed inset-0 z-[70] flex items-center justify-center p-4"
          @click.self="viewCategory = null"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div
            class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div
              class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ viewCategory.name }}
                <span
                  class="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                >
                  {{ viewProducts.length }} {{ t('products') }}
                </span>
              </h2>
              <button
                type="button"
                class="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                :aria-label="t('close')"
                @click="viewCategory = null"
              >
                <span class="text-lg leading-none">&times;</span>
              </button>
            </div>
            <div class="p-6">
              <div v-if="viewLoading" class="space-y-3">
                <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
              </div>
              <ul v-else-if="viewProducts.length" class="space-y-2">
                <li
                  v-for="product in viewProducts"
                  :key="product.id"
                  class="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800"
                >
                  <span class="font-medium text-gray-900 dark:text-white">{{ product.name }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatMoney(product.price) }}
                  </span>
                </li>
              </ul>
              <p v-else class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {{ t('noProductsYet') }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>