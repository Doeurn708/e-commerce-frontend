import { BACKEND_URL } from '../api/client'

/**
 * ---------------------------------------------------------------------------
 * Image URL handling
 * ---------------------------------------------------------------------------
 * Laravel stores a *relative path* in the `image` column (for example
 * `products/iphone17.jpg`, or a bare `iphone17.jpg` for older records) and
 * serves the public disk from `/storage/<path>`. Some records hold a full URL
 * instead, so every branch is checked before prefixing anything.
 */

const STORAGE_BASE = `${BACKEND_URL.replace(/\/+$/, '')}/storage`

/** Inline SVG used whenever a record has no usable image. */
export const PLACEHOLDER_IMAGE = svgImage('🛍️', '#eef2ff', '#c7d2fe')

/**
 * Upload rules. They must stay in sync with CloudinaryImageStore:
 * mimes:jpg,jpeg,png,webp + max:10240. Checking them here turns a silent
 * 422 (or a file that is dropped without ever reaching the API) into a
 * message the admin can actually act on.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Reason the file cannot be uploaded, or null when it is acceptable. */
export function imageFileError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Choose a JPG, PNG or WebP image.'
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `The image must not be greater than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`
  }

  return null
}

/** "photo.jpg (2.4 MB)" — shown next to the picker so a pending upload is obvious. */
export function fileLabel(file: File): string {
  const megabytes = file.size / 1024 / 1024
  const size = megabytes >= 1 ? `${megabytes.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`
  return `${file.name} (${size})`
}

function svgImage(emoji: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="300" cy="300" r="190" fill="rgba(255,255,255,0.5)"/><text x="300" y="356" font-size="200" text-anchor="middle">${emoji}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Turn whatever the API returned for `image` into something an <img> can load.
 * Falls back to PLACEHOLDER_IMAGE for empty values.
 */
export function imageUrl(image: string | null | undefined): string {
  const value = (image ?? '').trim()

  if (value === '') return PLACEHOLDER_IMAGE

  // Already absolute: data:, blob:, http(s):, protocol-relative
  if (/^(data:|blob:|https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value
  }

  // The backend may already have prefixed /storage/ for us.
  if (value.startsWith('/storage/')) {
    return `${BACKEND_URL.replace(/\/+$/, '')}${value}`
  }

  const path = value.replace(/^\/+/, '')

  // Older rows hold a bare filename with no folder; put it at the storage root.
  return `${STORAGE_BASE}/${path}`
}

/** Fallback handler for <img> so a missing file shows the placeholder. */
export function onImageError(event: Event): void {
  const img = event.target as HTMLImageElement | null
  if (img && img.src !== PLACEHOLDER_IMAGE) {
    img.src = PLACEHOLDER_IMAGE
  }
}
