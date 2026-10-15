/**
 * ---------------------------------------------------------------------------
 * Google Maps JavaScript API loader
 * ---------------------------------------------------------------------------
 * The Maps script is heavy (~300KB gzipped) and only the checkout page needs
 * it, so it is injected on demand by `loadGoogleMaps()` instead of living in
 * index.html. That keeps it out of the initial bundle for every other route.
 *
 * `loading=async` means the tag that gets injected is only a ~16KB bootstrap:
 * it publishes an empty `window.google.maps` object and then fetches the real
 * library from `maps-api-v3/api/js/<build>` in the background. The bootstrap's
 * own `load` event therefore fires LONG before `google.maps.Map` exists.
 *
 * That is the trap this file exists to avoid: resolving on the `load` event
 * alone hands callers a namespace where every constructor is `undefined`, so
 * `new google.maps.Map(...)` throws "is not a constructor" and any spinner
 * that waits on this promise hangs forever. `loadGoogleMaps()` therefore does
 * not resolve until `importLibrary('maps')` has actually delivered the
 * constructors. This is the `callback=initMap` pattern from Google's docs,
 * expressed as a promise instead of a global.
 *
 * The key comes from VITE_GOOGLE_MAPS_API_KEY. It is never hard-coded, and
 * because Vite inlines `import.meta.env` at build time this file is the only
 * place the key has to be referenced.
 *
 * This module deliberately requests NO add-on libraries. There is no
 * `libraries=places` on the tag and no Geocoding/Places call anywhere in the
 * app: the checkout map is coordinates-only, so the store needs a project that
 * can render Maps JavaScript and nothing else. Nothing here turns a coordinate
 * into an address.
 *
 * Concurrent callers share one promise, so the map waits on one load instead of
 * racing to inject a second tag.
 */

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()

const SCRIPT_ID = 'google-maps-js-api'

/**
 * How long to wait for the real library after the bootstrap tag loads. The
 * healthy path resolves in well under a second on a warm connection; this only
 * trips when the key or the network is broken, and it exists so a failure
 * becomes a readable message instead of an endless spinner.
 */
const BOOT_TIMEOUT_MS = 15000

/** How often the bootstrap is re-checked while waiting for importLibrary. */
const BOOT_POLL_MS = 25

/** Phnom Penh: the default view before the customer picks anything. */
export const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 } as const

export const DEFAULT_ZOOM = 13

/**
 * Why the load failed, mapped to the four `*MapError` names Google documents
 * plus the failure modes that live in this file. Callers switch on the code so
 * the customer sees the actual cause instead of a generic message.
 */
export type GoogleMapsErrorCode =
  | 'key-missing'
  | 'script-failed'
  | 'boot-timeout'
  | 'boot-failed'
  | 'invalid-key'
  | 'referer-not-allowed'
  | 'billing-not-enabled'
  | 'api-not-activated'

/**
 * Google reports key/project problems as console errors and rejected
 * `importLibrary` calls rather than as thrown Errors, and the names it uses
 * are the documented ones. Match them in the order Google most often reports
 * them.
 */
const GOOGLE_ERROR_PATTERNS: ReadonlyArray<readonly [RegExp, GoogleMapsErrorCode]> = [
  [/InvalidKeyMapError/, 'invalid-key'],
  [/RefererNotAllowedMapError/, 'referer-not-allowed'],
  [/BillingNotEnabledMapError/, 'billing-not-enabled'],
  [/ApiNotActivatedMapError|ApiProjectMapError/, 'api-not-activated'],
]

/** Pull the first documented `*MapError` name out of a message, if present. */
export function classifyGoogleError(message: string): GoogleMapsErrorCode | null {
  for (const [pattern, code] of GOOGLE_ERROR_PATTERNS) {
    if (pattern.test(message)) return code
  }

  return null
}

/** Carries the diagnosis so the component can pick the right message. */
export class GoogleMapsError extends Error {
  readonly code: GoogleMapsErrorCode

  constructor(code: GoogleMapsErrorCode, message: string) {
    super(message)
    this.name = 'GoogleMapsError'
    this.code = code
  }
}

/**
 * `RefererNotAllowedMapError` in particular is logged and then swallowed, so
 * nothing downstream ever sees it. Tapping console.error for the short window
 * in which the library boots is the only way to recover it. The original is
 * always restored and still receives every call, so nothing is hidden from the
 * developer's own devtools.
 */
function tapGoogleErrors(sink: string[]): () => void {
  const original = console.error

  console.error = (...args: unknown[]) => {
    const text = args
      .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
      .join(' ')

    if (/google maps/i.test(text)) sink.push(text)

    original.apply(console, args as [])
  }

  return () => {
    console.error = original
  }
}

/** True once the constructors the checkout page needs are actually present. */
export function isGoogleMapsReady(): boolean {
  return typeof window !== 'undefined' && typeof window.google?.maps?.Map === 'function'
}

/**
 * The bootstrap tag has three distinct readiness levels, and this file has to
 * respect all three in order:
 *
 *   1. `window.google.maps` exists  - immediately, it is the 2nd line of the
 *      bootstrap. Useless as a readiness signal.
 *   2. `google.maps.importLibrary` is a function - the bootstrap has installed
 *      its loader shim and the real library is downloadable.
 *   3. the imported library has been delivered - `new google.maps.Map()` works.
 *
 * The tag's `load` event only guarantees level 1. Waiting on the event alone
 * and then calling `importLibrary` throws "is not a function" for exactly this
 * reason, so level 2 is polled for before anything is invoked.
 */
function waitFor(predicate: () => boolean, diagnostics: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + BOOT_TIMEOUT_MS
    let pollId: ReturnType<typeof setTimeout>

    const tick = () => {
      if (predicate()) {
        clearTimeout(pollId)
        resolve()
        return
      }

      if (Date.now() >= deadline) {
        clearTimeout(pollId)
        reject(
          new GoogleMapsError(
            'boot-timeout',
            diagnostics[0] ?? 'Google Maps library did not finish loading',
          ),
        )
        return
      }

      pollId = setTimeout(tick, BOOT_POLL_MS)
    }

    pollId = setTimeout(tick, BOOT_POLL_MS)
  })
}

let loader: Promise<void> | null = null
/** Reset so a Retry button can trigger a genuinely fresh attempt. */
export function resetGoogleMapsLoader(): void {
  loader = null

  // Only drop the tag when the bootstrap never got as far as installing
  // importLibrary. Tearing out a live bootstrap and injecting a second one
  // makes Google report the API as included multiple times, which breaks the
  // namespace rather than fixing it.
  if (typeof window.google?.maps?.importLibrary !== 'function') {
    document.getElementById(SCRIPT_ID)?.remove()
  }
}

/** The key is optional in .env, so this is a normal state, not an error. */
export function hasGoogleMapsKey(): boolean {
  return API_KEY !== undefined && API_KEY !== ''
}

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      // Guarded by hasGoogleMapsKey() in loadGoogleMaps().
      key: API_KEY as string,
      loading: 'async',
      // v=weekly is Google's current recommended version pin; the legacy
      // v=3 param is no longer needed.
      v: 'weekly',
    })

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`

    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => {
        // Allow a later retry: a failed tag must not poison the shared promise.
        loader = null
        document.getElementById(SCRIPT_ID)?.remove()
        reject(new GoogleMapsError('script-failed', 'Google Maps failed to load'))
      },
      { once: true },
    )

    document.head.appendChild(script)
  })
}

/**
 * Pull the real library out of the bootstrap. Resolves only once `Map` is a
 * constructor; rejects with a classified `GoogleMapsError` otherwise.
 *
 * Only the `maps` library is imported: it supplies Map, Marker and LatLng,
 * which is everything the coordinates-only checkout needs.
 */
async function bootMapsLibrary(diagnostics: string[]): Promise<void> {
  await waitFor(() => typeof window.google?.maps?.importLibrary === 'function', diagnostics)

  try {
    await window.google!.maps.importLibrary('maps')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new GoogleMapsError(
      classifyGoogleError(message) ?? classifyGoogleError(diagnostics.join(' ')) ?? 'boot-failed',
      message,
    )
  }

  // `importLibrary` resolving is not the contract the rest of the app relies
  // on: every caller reaches for `new google.maps.Map(...)`, so assert it.
  if (!isGoogleMapsReady()) {
    throw new GoogleMapsError(
      classifyGoogleError(diagnostics.join(' ')) ?? 'boot-failed',
      diagnostics[0] ?? 'Google Maps loaded without the Map constructor',
    )
  }
}

/**
 * Load the Maps JS API once and resolve when `google.maps` is genuinely usable,
 * i.e. when `new google.maps.Map()` will not throw. Throws a classified
 * `GoogleMapsError` when the key is missing or the script/library fails, so
 * callers can show an error instead of rendering a broken map.
 */
export function loadGoogleMaps(): Promise<void> {
  if (!hasGoogleMapsKey()) {
    return Promise.reject(
      new GoogleMapsError('key-missing', 'VITE_GOOGLE_MAPS_API_KEY is not set'),
    )
  }

  // Already usable (e.g. the script was injected by something else).
  if (isGoogleMapsReady()) {
    return Promise.resolve()
  }

  if (loader) return loader

  const diagnostics: string[] = []
  const untap = tapGoogleErrors(diagnostics)

  loader = injectScript()
    .then(() => bootMapsLibrary(diagnostics))
    .catch((error: unknown) => {
      // A rejected shared promise would be cached forever, so a later Retry
      // has to be able to start over.
      loader = null
      throw error
    })
    .finally(untap)

  return loader
}
