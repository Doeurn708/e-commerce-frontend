<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Camera, Loader2, Trash2, X } from '@lucide/vue'
import { useAuth } from '../stores/auth'
import { useI18n } from '../stores/i18n'
import { toastError, toastSuccess } from '../stores/toast'
import { imageUrl, onImageError } from '../utils/image'

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { currentUser, updateProfile } = useAuth()
const { t } = useI18n()

const MAX_BYTES = 2 * 1024 * 1024
// Mirrors CloudinaryImageStore::ALLOWED (mimes:jpg,jpeg,png,webp). GIF is
// deliberately absent on both sides: offering it here would let the picker
// accept a file the API then rejects with a 422.
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

const name = ref('')
const phone = ref('')
const file = ref<File | null>(null)
const objectUrl = ref('')
const removeAvatar = ref(false)
const saving = ref(false)
const errors = ref<{ name?: string; phone?: string; avatar?: string }>({})
const fileInput = ref<HTMLInputElement | null>(null)

const storedAvatar = computed(
  () => currentUser.value?.avatar_url || currentUser.value?.avatar || '',
)

const previewSrc = computed(() => {
  if (objectUrl.value) return objectUrl.value
  if (removeAvatar.value) return ''
  return storedAvatar.value ? imageUrl(storedAvatar.value) : ''
})

const fallbackInitials = computed(() => {
  if (currentUser.value?.initials) return currentUser.value.initials

  const words = (currentUser.value?.name ?? name.value ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'

  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
})

watch(
  () => currentUser.value,
  (user) => {
    if (user) {
      name.value = user.name ?? ''
      phone.value = user.phone ?? ''
    }
  },
  { immediate: true },
)

function releaseObjectUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
}

onBeforeUnmount(releaseObjectUrl)

function close() {
  if (saving.value) return
  releaseObjectUrl()
  emit('close')
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0]

  if (!picked) return

  const next = { ...errors.value }
  delete next.avatar

  if (!ACCEPTED.includes(picked.type)) {
    next.avatar = t('invalidImage')
    errors.value = next
    input.value = ''
    return
  }

  if (picked.size > MAX_BYTES) {
    next.avatar = t('avatarTooLarge')
    errors.value = next
    input.value = ''
    return
  }

  errors.value = next

  releaseObjectUrl()
  file.value = picked
  objectUrl.value = URL.createObjectURL(picked)
  removeAvatar.value = false
}

function onClearSelection() {
  releaseObjectUrl()
  file.value = null
  removeAvatar.value = true

  if (fileInput.value) fileInput.value.value = ''
}

function validate(): boolean {
  const next: { name?: string; phone?: string } = {}
  const trimmedName = name.value.trim()

  if (!trimmedName) {
    next.name = t('nameRequired')
  } else if (trimmedName.length > 255) {
    next.name = t('nameTooLong')
  }

  const trimmedPhone = phone.value.trim()
  if (trimmedPhone.length > 30) next.phone = t('phoneTooLong')

  errors.value = next
  return Object.keys(next).length === 0
}

async function save() {
  if (saving.value) return
  if (!validate()) return

  saving.value = true

  try {
    await updateProfile({
      name: name.value.trim(),
      phone: phone.value.trim() || null,
      avatar: file.value,
      removeAvatar: removeAvatar.value && !file.value,
    })

    toastSuccess(t('profileUpdated'))
    releaseObjectUrl()
    emit('saved')
    emit('close')
  } catch (e) {
    const err = e as { message?: string; fieldErrors?: Record<string, string[]> } | null
    toastError(err?.message || t('profileUpdateFailed'))

    if (err?.fieldErrors) {
      errors.value = {
        name: err.fieldErrors.name?.[0],
        phone: err.fieldErrors.phone?.[0],
        avatar: err.fieldErrors.avatar?.[0],
      }
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      @click.self="close"
    >
        <div
          class="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-900"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('editProfile')"
        >
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ $t('editProfile') }}
            </h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              :aria-label="$t('cancel')"
              :disabled="saving"
              @click="close"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form class="flex flex-col gap-5 overflow-y-auto px-5 py-5" @submit.prevent="save">
            <!-- Avatar -->
            <div class="flex flex-col items-center gap-3">
              <div class="relative">
                <img
                  v-if="previewSrc"
                  :src="previewSrc"
                  :alt="$t('avatar')"
                  class="h-24 w-24 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                  @error="onImageError"
                />
                <span
                  v-else
                  class="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white"
                  aria-hidden="true"
                >
                  {{ fallbackInitials }}
                </span>

                <button
                  type="button"
                  class="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700 dark:border-gray-900 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  :aria-label="$t('changeAvatar')"
                  :disabled="saving"
                  @click="fileInput?.click()"
                >
                  <Camera class="h-4 w-4" />
                </button>
              </div>

              <input
                ref="fileInput"
                type="file"
                class="hidden"
                :accept="ACCEPTED.join(',')"
                @change="onPick"
              />

              <div class="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:text-indigo-300"
                  :disabled="saving"
                  @click="fileInput?.click()"
                >
                  {{ $t('uploadAvatar') }}
                </button>

                <button
                  v-if="previewSrc"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
                  :disabled="saving"
                  @click="onClearSelection"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  {{ $t('removeAvatar') }}
                </button>
              </div>

              <p class="text-center text-xs text-gray-400 dark:text-gray-500">
                {{ $t('avatarHint') }}
              </p>

              <p v-if="errors.avatar" class="text-center text-xs font-medium text-red-600 dark:text-red-400">
                {{ errors.avatar }}
              </p>
            </div>

            <!-- Name -->
            <div>
              <label for="profile-name" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ $t('fullName') }}
              </label>
              <input
                id="profile-name"
                v-model="name"
                type="text"
                maxlength="255"
                autocomplete="name"
                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                :class="errors.name
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-700 dark:bg-gray-800'"
                :placeholder="$t('fullNamePlaceholder')"
                :disabled="saving"
                @input="errors.name = undefined"
              />
              <p v-if="errors.name" class="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {{ errors.name }}
              </p>
            </div>

            <!-- Phone -->
            <div>
              <label for="profile-phone" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ $t('phone') }}
              </label>
              <input
                id="profile-phone"
                v-model="phone"
                type="tel"
                maxlength="30"
                autocomplete="tel"
                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                :class="errors.phone
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-700 dark:bg-gray-800'"
                :placeholder="$t('phonePlaceholder')"
                :disabled="saving"
                @input="errors.phone = undefined"
              />
              <p v-if="errors.phone" class="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {{ errors.phone }}
              </p>
            </div>

            <!-- Email is read-only: changing it needs a verified flow. -->
            <div>
              <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ $t('email') }}
              </span>
              <div
                class="w-full truncate rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
              >
                {{ currentUser?.email }}
              </div>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ $t('emailReadOnly') }}</p>
            </div>
          </form>

          <div class="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="saving"
              @click="close"
            >
              {{ $t('cancel') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              :disabled="saving"
              @click="save"
            >
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
              {{ saving ? $t('saving') : $t('saveChanges') }}
            </button>
          </div>
        </div>
      </div>
  </Teleport>
</template>
