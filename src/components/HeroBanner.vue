<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Flame, RefreshCcw, ShieldCheck, Tag, Truck } from '@lucide/vue'
import { useI18n } from '../stores/i18n'
import { discountPercent, effectivePrice } from '../stores/product'
import { imageUrl, onImageError } from '../utils/image'
import { formatMoney } from '../utils/format'
import type { Product } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Hero Banner
 * ---------------------------------------------------------------------------
 * The first thing on the home page. Its job is to hand the visitor off to the
 * Trending Products section that sits directly underneath it, so the primary
 * CTA is a same-page anchor (`#trending-products`) rather than a route change.
 *
 * The anchor target lives on a wrapper in HomeView.vue, so this component owns
 * the promo copy and nothing else. The section id is therefore defined next to
 * the section, not hard-coded into a scroll handler here.
 *
 * Smooth scrolling comes from the global `html { scroll-behavior: smooth }` in
 * style.css, and the `scroll-mt` on the target keeps the sticky navbar from
 * covering the heading. A plain `<a href>` keeps this keyboard accessible and
 * functional with JavaScript unavailable.
 *
 * Copy is translated (see the `hero*` keys in stores/i18n.ts). The heading is
 * split into lead + accent keys because "Trending" needs its own colour, which
 * a single interpolated string cannot express in this i18n setup.
 *
 * The artwork is real: `products` is the same trending array the section below
 * renders, so the banner advertises the actual top row instead of stock art.
 * FALLBACK_IMAGE only covers the window before the request resolves, and any
 * error/empty response falls back through imageUrl() to PLACEHOLDER_IMAGE.
 */

const props = defineProps<{
  products?: Product[]
}>()

const { t } = useI18n()

const TRENDING_ANCHOR = '#trending-products'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'

const topProduct = computed<Product | null>(() => props.products?.[0] ?? null)

const heroImage = computed(() =>
  topProduct.value ? imageUrl(topProduct.value.image) : FALLBACK_IMAGE,
)

const heroImageAlt = computed(() =>
  topProduct.value?.name?.trim()
    ? topProduct.value.name
    : t('heroFallbackImageAlt'),
)

const price = computed(() =>
  topProduct.value ? formatMoney(effectivePrice(topProduct.value)) : '',
)

const wasPrice = computed(() =>
  topProduct.value ? formatMoney(topProduct.value.price) : '',
)

const discount = computed(() =>
  topProduct.value ? discountPercent(topProduct.value) : null,
)

const perks = computed(() => [
  { icon: Truck, title: t('heroBenefitShipping'), text: t('heroBenefitShippingText') },
  { icon: ShieldCheck, title: t('heroBenefitPayment'), text: t('heroBenefitPaymentText') },
  { icon: RefreshCcw, title: t('heroBenefitReturns'), text: t('heroBenefitReturnsText') },
])
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
    <!-- decorative blur -->
    <div
      class="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute left-1/3 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-fuchsia-400/20 blur-3xl"
      aria-hidden="true"
    ></div>

    <div class="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-20 md:py-24 lg:grid-cols-2">
      <!-- copy -->
      <div class="text-center text-white lg:text-left">
        <span
          class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur"
        >
          <Flame class="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
          {{ $t('heroBadge') }}
        </span>

        <h1 class="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          {{ $t('heroTitleLead') }}
          <span class="text-amber-300">{{ $t('heroTitleAccent') }}</span>
        </h1>

        <p class="mx-auto mt-5 max-w-lg text-base text-indigo-100 md:text-lg lg:mx-0">
          {{ $t('heroSubtitleTrending') }}
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <a
            :href="TRENDING_ANCHOR"
            class="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {{ $t('exploreTrending') }}
            <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
          <RouterLink
            to="/categories"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {{ $t('browseCategories') }}
          </RouterLink>
        </div>
      </div>

      <!-- image + floating cards -->
      <div class="relative hidden lg:block">
        <div
          class="group relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20"
        >
          <img
            :src="heroImage"
            :alt="heroImageAlt"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            @error="onImageError"
          />

          <!-- product caption: only once real trending data has arrived -->
          <div
            v-if="topProduct"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-950/85 via-indigo-950/45 to-transparent px-5 pb-4 pt-12"
          >
            <p class="line-clamp-2 text-sm font-bold text-white">{{ topProduct.name }}</p>
            <p class="mt-1 flex items-baseline gap-2">
              <span class="text-xl font-extrabold text-amber-300">{{ price }}</span>
              <span v-if="discount" class="text-xs text-indigo-200 line-through">{{ wasPrice }}</span>
              <span
                v-if="discount"
                class="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white"
              >
                -{{ discount }}%
              </span>
            </p>
          </div>

          <!-- card 1: trending -->
          <div
            class="absolute left-5 top-5 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 shadow-xl backdrop-blur-md"
          >
            <p class="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
              <Flame class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {{ $t('heroCardTrendingLabel') }}
            </p>
            <p class="mt-0.5 text-sm font-bold text-white">{{ $t('heroCardTrendingText') }}</p>
          </div>

          <!-- card 2: offer. Anchored top-right so it clears the caption strip. -->
          <div
            class="absolute right-5 top-5 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 shadow-xl backdrop-blur-md"
          >
            <p class="flex items-center gap-1.5 text-xs font-medium text-indigo-100">
              <Tag class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {{ $t('heroCardOfferLabel') }}
            </p>
            <p class="mt-0.5 text-2xl font-extrabold text-amber-300">{{ $t('heroCardOfferText') }}</p>
          </div>

          <!-- rank badge -->
          <div
            class="absolute -right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-xl"
          >
            <Flame class="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
            {{ $t('heroRankBadge') }}
          </div>
        </div>
      </div>
    </div>

    <!-- benefits -->
    <div class="relative mx-auto max-w-7xl px-4 pb-8">
      <ul class="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <li
          v-for="perk in perks"
          :key="perk.title"
          class="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
        >
          <component :is="perk.icon" class="h-6 w-6 shrink-0 text-white" aria-hidden="true" />
          <div>
            <p class="text-sm font-semibold text-white">{{ perk.title }}</p>
            <p class="text-xs text-indigo-100">{{ perk.text }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>