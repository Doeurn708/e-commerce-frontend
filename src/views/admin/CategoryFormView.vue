<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import { getCategory, createCategory, updateCategory, type CategoryPayload } from '../../api/categories'
import { imageUrl, onImageError } from '../../utils/image'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const categoryId = computed(() => (isEdit.value ? String(route.params.id) : null))

const loading = ref(isEdit.value)
const saving = ref(false)
const error = ref('')
const feedback = ref('')
const feedbackError = ref(false)

const form = ref({
  name: '',
  description: '',
  image: '',
})

/** Same string-or-File contract as the product form. */
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const imageInput = ref<HTMLInputElement | null>(null)
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const currentImage = computed(() => imagePreview.value || imageUrl(form.value.image))

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

async function loadCategory() {
  if (!categoryId.value) return
  loading.value = true
  error.value = ''
  try {
    const category = await getCategory(categoryId.value)
    form.value = {
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(loadCategory)

async function onSubmit() {
  if (!form.value.name.trim()) {
    showFeedback(t('pleaseFillAll'), true)
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload: CategoryPayload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      image: imageFile.value ?? (form.value.image.trim() || undefined),
    }
    if (isEdit.value && categoryId.value) {
      await updateCategory(categoryId.value, payload)
      showFeedback(t('categoryUpdatedMsg'))
    } else {
      await createCategory(payload)
      showFeedback(t('categoryCreatedMsg'))
    }
    router.push('/admin/categories')
  } catch (e) {
    showFeedback(e instanceof Error ? e.message : t('operationFailed'), true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-xl space-y-6">
    <div>
      <button
        type="button"
        class="mb-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
        @click="router.push('/admin/categories')"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ $t('backToCategories') }}
      </button>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ isEdit ? $t('editCategory') : $t('addCategory') }}
      </h1>
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
      class="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div v-for="i in 3" :key="i" class="h-11 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"></div>
    </div>

    <form
      v-else
      class="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      @submit.prevent="onSubmit"
    >
      <div>
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
              placeholder="categories/example.jpg or https://..."
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
          {{ $t('description') }}
        </label>
        <textarea
          v-model="form.description"
          rows="4"
          class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        ></textarea>
      </div>

      <div class="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="button"
          class="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          @click="router.push('/admin/categories')"
        >
          {{ $t('cancel') }}
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          :disabled="saving"
        >
          <Save class="h-4 w-4" />
          {{ saving ? $t('loading') : (isEdit ? $t('saveCategory') : $t('addCategory')) }}
        </button>
      </div>
    </form>
  </div>
</template>