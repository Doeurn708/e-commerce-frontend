import { ref } from 'vue'

const THEME_KEY = 'ecommerce_theme'

function applyClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

const isDark = ref(false)

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = stored === 'dark' || (stored === null && prefersDark)
  applyClass(isDark.value)
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
  applyClass(isDark.value)
}

initTheme()

export function useTheme() {
  return { isDark, toggleTheme }
}