import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // VITE_* values are inlined into the bundle at build time. A production build
  // that still carries the placeholder or a loopback address points every API
  // call — including image uploads — at the developer's own machine, so the
  // deployed site silently cannot reach the backend.
  if (mode === 'production') {
    const api = env.VITE_API_BASE_URL ?? ''
    const backend = env.VITE_BACKEND_URL ?? ''
    const unusable = (value: string) =>
      value === '' || value.includes('YOUR_BACKEND_HOST') || /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(value)

    if (unusable(api) || unusable(backend)) {
      throw new Error(
        'Refusing to build: VITE_API_BASE_URL / VITE_BACKEND_URL must point at the deployed API.\n' +
          `  VITE_API_BASE_URL="${api}"\n` +
          `  VITE_BACKEND_URL="${backend}"\n` +
          'Set them in Vercel -> Settings -> Environment Variables, or in frontend/.env.production.',
      )
    }
  }

  return { plugins: [vue()] }
})
