<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCcw, Save, X, RefreshCw } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getCustomers, updateCustomer } from '../../api/customers'
import CustomerTable from '../../components/admin/CustomerTable.vue'
import SearchInput from '../../components/admin/SearchInput.vue'
import FilterSelect from '../../components/admin/FilterSelect.vue'
import ConfirmModal from '../../components/admin/ConfirmModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusBadge from '../../components/admin/StatusBadge.vue'
import { formatMoney, formatDateTime } from '../../utils/format'
import type { Customer } from '../../types'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const customers = ref<Customer[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const lastPage = ref(1)

const filters = reactive<{
  search: string
  role: string
  status: string
  sort: string
}>({
  search: '',
  role: '',
  status: '',
  sort: 'latest',
})

const viewCustomer = ref<Customer | null>(null)
const editCustomer = ref<Customer | null>(null)
const editForm = reactive<{
  name: string
  email: string
  role: string
}>({
  name: '',
  email: '',
  role: 'customer',
})
const toggleTarget = ref<Customer | null>(null)
const toggleLoading = ref(false)
const saving = ref(false)

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
    const result = await getCustomers({
      search: filters.search || undefined,
      role: (filters.role as 'customer' | 'admin' | undefined) || undefined,
      status: (filters.status as 'active' | 'suspended' | undefined) || undefined,
      sort: (filters.sort as 'latest' | 'name_asc' | 'name_desc' | 'spent_desc' | 'orders_desc'),
      page: page.value,
      per_page: perPage.value,
    })
    customers.value = result.data
    total.value = result.total
    lastPage.value = result.last_page
    page.value = result.page
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
    customers.value = []
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

const hasFilters = computed(
  () => !!(filters.search || filters.role || filters.status || filters.sort !== 'latest'),
)

function clearFilters() {
  filters.search = ''
  filters.role = ''
  filters.status = ''
  filters.sort = 'latest'
  page.value = 1
  load()
}

function openEdit(customer: Customer) {
  editCustomer.value = customer
  editForm.name = customer.name
  editForm.email = customer.email
  editForm.role = customer.role ?? 'customer'
}

async function onSaveEdit() {
  if (!editCustomer.value) return
  saving.value = true
  try {
    await updateCustomer(editCustomer.value.id, {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role === 'admin' ? 'admin' : 'customer',
    })
    showFeedback(t('customerUpdatedMsg'))
    editCustomer.value = null
    await load()
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    saving.value = false
  }
}

async function onToggleConfirmed() {
  if (!toggleTarget.value) return
  toggleLoading.value = true
  const target = toggleTarget.value
  const nextActive = !target.is_active
  try {
    await updateCustomer(target.id, { is_active: nextActive })
    showFeedback(nextActive ? t('customerEnabledMsg') : t('customerDisabledMsg'))
    toggleTarget.value = null
    await load()
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    toggleLoading.value = false
  }
}

function viewOrders(customer: Customer) {
  router.push({ path: '/admin/orders', query: { search: customer.email } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('customers') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('itemsCount', { n: total }) }}
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-indigo-900/30"
        :disabled="loading"
        @click="load"
      >
        <RefreshCw class="h-4 w-4" />
        {{ $t('refresh') }}
      </button>
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
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
        <SearchInput
          v-model="filters.search"
          :placeholder="t('searchCustomers')"
          :aria-label="t('searchCustomers')"
        />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:w-auto xl:flex-none">
          <FilterSelect
            v-model="filters.role"
            :options="[
              { value: 'customer', label: t('customers') },
              { value: 'admin', label: t('role') },
            ]"
            :all-label="t('allRoles')"
            :aria-label="t('role')"
          />
          <FilterSelect
            v-model="filters.status"
            :options="[
              { value: 'active', label: t('active') },
              { value: 'suspended', label: t('suspended') },
            ]"
            :all-label="t('allStatuses')"
            :aria-label="t('accountStatus')"
          />
          <FilterSelect
            v-model="filters.sort"
            :options="[
              { value: 'name_asc', label: t('sortNameAZ') },
              { value: 'spent_desc', label: t('spentHighLow') },
              { value: 'orders_desc', label: t('ordersMostFirst') },
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

    <CustomerTable
      :customers="customers"
      :loading="loading"
      :error="error"
      @retry="load"
      @view="viewCustomer = $event"
      @orders="viewOrders"
      @edit="openEdit"
      @toggle="toggleTarget = $event"
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
          v-if="viewCustomer"
          class="fixed inset-0 z-[70] flex items-center justify-center p-4"
          @click.self="viewCustomer = null"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div
            class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('customerInformation') }}</h3>
            <div class="mt-4 space-y-3 text-sm">
              <div class="flex items-center gap-3">
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white"
                >
                  {{ viewCustomer.name.slice(0, 2).toUpperCase() }}
                </span>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ viewCustomer.name }}</p>
                  <p class="truncate text-xs text-gray-400">{{ viewCustomer.email }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('ordersCount') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ viewCustomer.orders_count ?? 0 }}</p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('totalSpent') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ formatMoney(viewCustomer.total_spent) }}
                  </p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('phone') }}</p>
                  <p class="truncate font-semibold text-gray-900 dark:text-white">
                    {{ viewCustomer.phone || '—' }}
                  </p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('registered') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ formatDateTime(viewCustomer.created_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('accountStatus') }}</p>
                <StatusBadge :value="viewCustomer.is_active ? 'active' : 'suspended'" />
              </div>
            </div>
            <div class="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                class="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                @click="viewCustomer = null"
              >
                {{ t('close') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                @click="openEdit(viewCustomer); viewCustomer = null"
              >
                {{ t('edit') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition"
                :class="viewCustomer.is_active
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'"
                @click="toggleTarget = viewCustomer; viewCustomer = null"
              >
                {{ viewCustomer.is_active ? t('disableAccount') : t('enableAccount') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                @click="viewOrders(viewCustomer)"
              >
                {{ t('viewOrders') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
          v-if="editCustomer"
          class="fixed inset-0 z-[70] flex items-center justify-center p-4"
          @click.self="!saving && (editCustomer = null)"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div
            class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              type="button"
              class="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              :aria-label="t('close')"
              :disabled="saving"
              @click="editCustomer = null"
            >
              <X class="h-4 w-4" />
            </button>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('editCustomer') }}</h3>
            <form class="mt-4 space-y-4" @submit.prevent="onSaveEdit">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('name') }}
                </label>
                <input
                  v-model="editForm.name"
                  type="text"
                  required
                  class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('email') }}
                </label>
                <input
                  v-model="editForm.email"
                  type="email"
                  required
                  class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('role') }}
                </label>
                <select
                  v-model="editForm.role"
                  class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option value="customer">{{ t('customers') }}</option>
                  <option value="admin">{{ t('role') }}</option>
                </select>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p class="text-sm text-gray-600 dark:text-gray-300">{{ t('accountStatus') }}</p>
                <StatusBadge :value="editCustomer.is_active ? 'active' : 'suspended'" />
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  :disabled="saving"
                  @click="editCustomer = null"
                >
                  {{ t('cancel') }}
                </button>
                <button
                  type="submit"
                  class="flex flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  :disabled="saving"
                >
                  <Save class="h-4 w-4" />
                  {{ saving ? t('loading') : t('save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmModal
      :open="!!toggleTarget"
      :title="toggleTarget?.is_active ? t('disableAccount') : t('enableAccount')"
      :message="toggleTarget?.is_active ? t('customerDisabledMsg') : t('customerEnabledMsg')"
      :confirm-text="toggleTarget?.is_active ? t('disableAccount') : t('enableAccount')"
      :cancel-text="t('cancel')"
      :loading="toggleLoading"
      @confirm="onToggleConfirmed"
      @cancel="toggleTarget = null"
    />
  </div>
</template>