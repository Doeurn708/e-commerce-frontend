<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getProduct, createProduct, updateProduct } from '../../api/products'
import { getCategories } from '../../api/categories'
import type { ProductPayload } from '../../api/products'
import { imageUrl, onImageError } from '../../utils/image'
import type { Category } from '../../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const productId = computed(() => (isEdit.value ? String(route.params.id) : null))

const loading = ref(isEdit.value)
const saving = ref(false)
const error = ref('')
const feedback = ref('')
const feedbackError = ref(false)

const categories = ref<Category[]>([])

const form = ref({
  name: '',
  category_id: '',
  description: '',
  price: '',
  stock: '',
  image: '',
})

/**
 * The backend accepts either a path/URL string or a multipart file upload
 * (ProductController delegates to CloudinaryImageStore). A File here is sent as
 * FormData, a string is sent as normal JSON.
 */
const imageFile = ref<File | null>(null)
const imagePreview = ref('')

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  imageFile.value = null
  imagePreview.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    showFeedback(t('operationFailed'), true)
    input.value = ''
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    showFeedback('The image must not be greater than 2048 kilobytes.', true)
    input.value = ''
    return
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function clearImage() {
  imageFile.value = null
  imagePreview.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

const imageInput = ref<HTMLInputElement | null>(null)

/** The image currently shown: the new upload, or the stored one. */
const currentImage = computed(() => imagePreview.value || imageUrl(form.value.image))

onBeforeUnmount(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
})

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

async function loadProduct() {
  if (!productId.value) return
  loading.value = true
  error.value = ''
  try {
    const product = await getProduct(productId.value)
    form.value = {
      name: product.name,
      category_id: product.category_id ? String(product.category_id) : '',
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      image: product.image ?? '',
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadProduct()
})

async function onSubmit() {
  if (!form.value.name.trim()) {
    showFeedback(t('pleaseFillAll'), true)
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload: ProductPayload = {
      name: form.value.name.trim(),
      category_id: Number(form.value.category_id),
      description: form.value.description.trim() || undefined,
      price: Number(form.value.price || 0),
      stock: Number(form.value.stock || 0),
      // A new upload wins; otherwise keep whatever path is already stored.
      image: imageFile.value ?? (form.value.image.trim() || undefined),
    }
    if (isEdit.value && productId.value) {
      await updateProduct(productId.value, payload)
      showFeedback(t('productUpdatedMsg'))
    } else {
      await createProduct(payload)
      showFeedback(t('productCreatedMsg'))
    }
    router.push('/admin/products')
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <button
          type="button"
          class="mb-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
          @click="router.push('/admin/products')"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ $t('backToProducts') }}
        </button>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ isEdit ? $t('editProduct') : $t('addProduct') }}
        </h1>
      </div>
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

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div v-for="i in 4" :key="i" class="mb-4 h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"></div>
    </div>

    <form
      v-else
      class="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      @submit.prevent="onSubmit"
    >
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('name') }} *
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('categories') }}
          </label>
          <select
            v-model="form.category_id"
            class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">—</option>
            <option v-for="category in categories" :key="category.id" :value="String(category.id)">
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('image') }}
          </label>
          <div class="flex flex-wrap items-center gap-4">
            <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              <img :src="currentImage" :alt="form.name" class="h-full w-full object-cover" @error="onImageError" />
            </div>
            <div class="flex-1 space-y-2">
              <input
                ref="imageInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-900/40 dark:file:text-indigo-300"
                @change="onImageSelected"
              />
              <input
                v-model="form.image"
                type="text"
                placeholder="products/example.jpg or https://..."
                class="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Uploading a file overrides the path above. Max 2 MB.
              </p>
            </div>
            <button
              v-if="imageFile || form.image"
              type="button"
              class="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-500 dark:border-gray-600 dark:text-gray-300"
              @click="clearImage"
            >
              {{ $t('clear') }}
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('price') }} *
          </label>
          <input
            v-model="form.price"
            type="number"
            min="0"
            step="0.01"
            required
            class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('stockHeader') }} *
          </label>
          <input
            v-model="form.stock"
            type="number"
            min="0"
            step="1"
            required
            class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('description') }}
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="button"
          class="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          @click="router.push('/admin/products')"
        >
          {{ $t('cancel') }}
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          :disabled="saving"
        >
          <Save class="h-4 w-4" />
          {{ saving ? $t('loading') : (isEdit ? $t('saveProduct') : $t('addProduct')) }}
        </button>
      </div>
    </form>
  </div>
</template>