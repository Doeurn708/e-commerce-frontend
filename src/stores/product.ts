/**
 * Pure display helpers for products.
 *
 * The data itself lives in the API layer (src/api/products.ts,
 * src/api/categories.ts) and is cached in src/stores/catalog.ts. Nothing here
 * holds a hardcoded record, so these stay pure and safe to call from templates.
 */

/** Price actually charged: the discount price when it is lower than the list price. */
export function effectivePrice(p: { price: number; discount_price?: number }): number {
  return p.discount_price ?? p.price
}

/** Whole-number discount percentage, or null when there is no real discount. */
export function discountPercent(p: { price: number; discount_price?: number }): number | null {
  if (!p.discount_price || p.discount_price >= p.price) return null
  return Math.round(((p.price - p.discount_price) / p.price) * 100)
}

export function inStock(p: { stock?: number }): boolean {
  return (p.stock ?? 0) > 0
}

/**
 * Products and orders do not carry a rating column, so the UI shows an
 * "unrated" state instead of inventing stars.
 */
export function hasRating(p: { rating?: number; reviews_count?: number }): boolean {
  return (p.reviews_count ?? 0) > 0
}
