<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { Loader2, LocateFixed, MapPin, RefreshCw, X } from '@lucide/vue'
import { useI18n } from '../../stores/i18n'
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  GoogleMapsError,
  hasGoogleMapsKey,
  isGoogleMapsReady,
  loadGoogleMaps,
  resetGoogleMapsLoader,
  type GoogleMapsErrorCode,
} from '../../utils/googleMaps'
import type { SelectedLocation } from '../../types'

/**
 * ---------------------------------------------------------------------------
 * CheckoutMap
 * ---------------------------------------------------------------------------
 * Delivery location is chosen with the Google Maps JavaScript API and stored as
 * a bare coordinate pair. Nothing here asks Google for an address: there is no
 * Geocoding call, no Places request and no autocomplete, so the project only
 * has to be able to render maps.
 *
 * The customer picks the pin three ways, and all three funnel through
 * `select()`: clicking the map, dragging the marker, and the browser's own
 * geolocation. `select()` is synchronous, so the hidden inputs and the emitted
 * location can never drift apart from the pin on screen.
 *
 * The hidden inputs carry the real form values (`name`/`id` match what the
 * backend validates) so the coordinates travel with a plain form post, while
 * the `update:location` event is what the Vue parent actually reads.
 *
 * Accessibility: the map canvas is aria-hidden (Google's own controls are not
 * reliably screen-reader navigable), while the geolocation button, the hidden
 * coordinate readout and the retry button are all real focusable controls. The
 * latitude/longitude readout is always visible once a pin exists, so the
 * location is never conveyed by a marker alone.
 *
 * The classic google.maps.Marker is used rather than AdvancedMarkerElement
 * because the latter requires "Maps JavaScript API (New)" plus a map ID, and
 * this project only needs the standard Maps JavaScript API.
 */

const emit = defineEmits<{
  'update:location': [value: SelectedLocation | null]
}>()

const { t } = useI18n()

const DEFAULT_LAT = DEFAULT_CENTER.lat
const DEFAULT_LNG = DEFAULT_CENTER.lng

const mapEl = ref<HTMLDivElement | null>(null)

const loading = ref(true)
const loadError = ref('')
const locating = ref(false)
/** True once a pin exists; gates the parent submit button. */
const hasSelection = ref(false)

const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)

/**
 * shallowRef, not ref: the Maps objects are large class instances that should
 * not be made reactive. Only the plain values above drive the template.
 */
const map = shallowRef<google.maps.Map | null>(null)
const marker = shallowRef<google.maps.Marker | null>(null)
let mapClickListener: google.maps.MapsEventListener | null = null

/**
 * The four documented `*MapError` names plus this component's own failure
 * modes, each with its own fix. A single "could not load" string hides the
 * difference between a typo in the key and an unactivated API, which are fixed
 * in completely different places.
 */
const LOAD_ERROR_MESSAGES: Record<GoogleMapsErrorCode, string> = {
  'key-missing': 'mapKeyMissing',
  'script-failed': 'mapLoadFailed',
  'boot-timeout': 'mapLoadTimedOut',
  'boot-failed': 'mapLoadFailed',
  'invalid-key': 'mapErrorInvalidKey',
  'referer-not-allowed': 'mapErrorReferer',
  'billing-not-enabled': 'mapErrorBilling',
  'api-not-activated': 'mapErrorNotActivated',
}

/**
 * Turn any thrown value into a customer-facing sentence. Anything unrecognised
 * falls back to the generic message, but the console keeps the raw text so the
 * real cause is never lost during debugging.
 */
function describeLoadFailure(error: unknown): string {
  const code = error instanceof GoogleMapsError ? error.code : 'boot-failed'

  if (!(error instanceof GoogleMapsError)) {
    console.error('[checkout-map] Google Maps failed to initialise:', error)
  }

  return t(LOAD_ERROR_MESSAGES[code])
}

/**
 * The single place a location becomes real. Writes the hidden inputs, the
 * readout and the emitted value from the same two numbers, so there is exactly
 * one source of truth and no async step that could be left pending.
 */
function select(lat: number, lng: number) {
  // Defensive: a malformed fix from the browser's geolocation must not be
  // stored, because the backend rejects it and the customer cannot order.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return

  marker.value?.setPosition({ lat, lng })

  latitude.value = Number(lat.toFixed(7))
  longitude.value = Number(lng.toFixed(7))

  hasSelection.value = true
  emit('update:location', { latitude: latitude.value, longitude: longitude.value })
}

/**
 * Place the marker on whatever the map is currently showing. Used once on
 * mount to seed a draft pin at the default centre; there is deliberately no
 * watch on the viewport, so panning the map on its own never moves the pin or
 * fires a change.
 */
function placeMarkerAtCenter() {
  if (!map.value) return
  const center = map.value.getCenter()
  if (!center) return
  select(center.lat(), center.lng())
}

/**
 * Browser geolocation. This is the platform API, not Google's, so it costs
 * nothing and needs no Places/Geocoding permission on the Google project.
 */
function useMyLocation() {
  if (!('geolocation' in navigator)) {
    loadError.value = t('mapLocationUnsupported')
    return
  }

  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false

      const { latitude: lat, longitude: lng } = position.coords
      map.value?.panTo({ lat, lng })
      map.value?.setZoom(16)
      select(lat, lng)
    },
    (error) => {
      locating.value = false
      loadError.value =
        error.code === error.PERMISSION_DENIED
          ? t('mapLocationDenied')
          : t('mapLocationUnavailable')
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  )
}

function clearSelection() {
  latitude.value = null
  longitude.value = null

  if (marker.value) {
    marker.value.setMap(null)
    marker.value = null
  }

  hasSelection.value = false
  emit('update:location', null)
}

/**
 * Build the map and the marker.
 *
 * The whole body sits inside one try/catch on purpose. Previously only the
 * `await loadGoogleMaps()` was guarded, so anything that threw afterwards
 * escaped as an unhandled rejection from the onMounted callback and left
 * `loading` stuck on true. That is the "stuck on Loading Google Maps..." report:
 * nothing was retrying and nothing was failing visibly.
 */
function buildMap(): void {
  if (!isGoogleMapsReady()) {
    throw new GoogleMapsError(
      'boot-failed',
      'Google Maps reported ready but google.maps.Map is still undefined',
    )
  }

  const container = mapEl.value
  if (!container) return

  map.value = new window.google.maps.Map(container, {
    center: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
    zoom: DEFAULT_ZOOM,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    clickableIcons: false,
  })

  marker.value = new window.google.maps.Marker({
    map: map.value,
    position: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
    draggable: true,
    title: t('deliveryLocation'),
  })

  marker.value.addListener('dragend', (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    select(event.latLng.lat(), event.latLng.lng())
  })

  mapClickListener = map.value.addListener('click', (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    select(event.latLng.lat(), event.latLng.lng())
  })
}

/**
 * Load the library and put a map on screen. Every failure path ends with
 * `loading = false`, so the spinner can never outlive the attempt.
 */
async function initMap(): Promise<void> {
  loading.value = true
  loadError.value = ''

  if (!hasGoogleMapsKey()) {
    loadError.value = t('mapKeyMissing')
    loading.value = false
    return
  }

  try {
    await loadGoogleMaps()

    if (unmounted) return

    buildMap()
  } catch (error) {
    if (unmounted) return

    loadError.value = describeLoadFailure(error)
    loading.value = false
    return
  }

  if (unmounted) return

  loading.value = false

  // Seed the pin on the map centre so there is always something visible and
  // reversible to work from. This is a draft, not a decision: the parent keeps
  // locationConfirmed false until the customer presses "Confirm Delivery
  // Location", and any later move clears that again.
  placeMarkerAtCenter()
}

/**
 * Retry after a failed boot. The loader caches its rejected promise, so the
 * cache is cleared first, otherwise the same error would be replayed instantly.
 */
function retry() {
  resetGoogleMapsLoader()
  void initMap()
}

/** Set once the component gives up on a boot attempt, so Retry can re-run it. */
let unmounted = false

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  unmounted = true
  mapClickListener?.remove()
  mapClickListener = null
  marker.value = null
  map.value = null
})
</script>

<template>
  <div class="space-y-4">
    <!--
      The values the backend validates. `name`/`id` match the API contract, and
      v-model is the only writer, so the inputs cannot drift from the pin.
    -->
    <input id="latitude" v-model="latitude" type="hidden" name="latitude" />
    <input id="longitude" v-model="longitude" type="hidden" name="longitude" />

    <!-- geolocation -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        :disabled="locating || Boolean(loadError)"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
        @click="useMyLocation"
      >
        <Loader2 v-if="locating" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <LocateFixed v-else class="h-4 w-4" aria-hidden="true" />
        {{ locating ? $t('mapLocating') : $t('mapUseMyLocation') }}
      </button>
    </div>

    <!-- map / states -->
    <div
      class="relative h-[420px] overflow-hidden rounded-3xl border border-gray-200 shadow-sm sm:h-[480px] dark:border-gray-700"
    >
      <!--
        The map canvas is always in the DOM and never `display:none`, and the
        spinner/error are absolutely positioned on top of it. A `v-show` here
        would mean the element had zero size at the exact moment
        `new google.maps.Map()` measured it, producing a map that initialised at
        0x0 and could stay blank even after it appeared. Google caches the size
        it computed at construction, so it has to be given a real box up front.
        The wrapper above owns the height.
      -->
      <div id="checkout-map" ref="mapEl" class="h-full w-full" aria-hidden="true"></div>

      <div
        v-if="loadError"
        role="alert"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-50 px-6 text-center dark:bg-red-950/30"
      >
        <MapPin class="h-8 w-8 text-red-400" aria-hidden="true" />
        <p class="text-sm font-semibold text-red-700 dark:text-red-300">{{ loadError }}</p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
          @click="retry"
        >
          <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" />
          {{ $t('mapRetry') }}
        </button>
      </div>

      <div
        v-else-if="loading"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800/50"
      >
        <Loader2 class="h-7 w-7 animate-spin text-indigo-500" aria-hidden="true" />
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('mapLoading') }}</p>
      </div>

      <button
        v-if="hasSelection"
        type="button"
        class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md backdrop-blur transition hover:bg-white dark:bg-gray-900/95 dark:text-gray-200"
        @click="clearSelection"
      >
        <X class="h-3.5 w-3.5" aria-hidden="true" />
        {{ $t('mapClear') }}
      </button>
    </div>

    <!-- selected location readout -->
    <div
      v-if="hasSelection"
      class="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-800 dark:bg-indigo-900/20"
    >
      <div class="flex items-start gap-3">
        <MapPin class="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
        <div class="min-w-0">
          <p class="text-sm font-bold text-gray-900 dark:text-white">{{ $t('deliveryLocation') }}</p>
          <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{{ $t('mapCoordinatesOnly') }}</p>
          <dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            <div class="flex gap-1">
              <dt class="font-medium">{{ $t('latitude') }}:</dt>
              <dd class="tabular-nums">{{ latitude?.toFixed(7) }}</dd>
            </div>
            <div class="flex gap-1">
              <dt class="font-medium">{{ $t('longitude') }}:</dt>
              <dd class="tabular-nums">{{ longitude?.toFixed(7) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <p v-else-if="!loadError && !loading" class="text-sm text-gray-500 dark:text-gray-400">
      {{ $t('mapPickHint') }}
    </p>
  </div>
</template>