<script setup lang="ts">
import ConfirmDialog from '../ConfirmDialog.vue'

defineProps<{
  open?: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <ConfirmDialog
    :open="open"
    :title="title"
    :message="message"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :loading="loading"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>