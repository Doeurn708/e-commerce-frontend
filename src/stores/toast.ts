import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])

let nextId = 1

function show(message: string, type: ToastType = 'success') {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => dismiss(id), 3000)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useToast() {
  return { toasts, show, dismiss }
}

export function toastSuccess(message: string) {
  show(message, 'success')
}

export function toastError(message: string) {
  show(message, 'error')
}

export function toastInfo(message: string) {
  show(message, 'info')
}