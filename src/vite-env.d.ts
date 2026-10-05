/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_BACKEND_URL: string
  /**
   * Google Maps JavaScript API key used by the checkout delivery map.
   * Optional so the rest of the SPA still builds without it; the map component
   * shows a setup message when it is missing.
   */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}