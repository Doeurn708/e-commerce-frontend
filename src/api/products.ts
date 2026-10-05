import { client, toApiError } from './client'
import { normalizePaginated, normalizeProduct, normalizeProducts } from './helpers'
import type { AdminProductQuery, Paginated, Product, ProductQuery } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Products API
 * ---------------------------------------------------------------------------
 * Endpoints (all verified against `php artisan route:list --path=api`):
 *   GET    /api/products            public, paginated + filtered
 *   GET    /api/products/{id}       public
 *   GET    /api/products/{id}/related
 *   POST   /api/products            auth:sanctum + role:admin
 *   PUT    /api/products/{id}       auth:sanctum + role:admin
 *   PATCH  /api/products/{id}       auth:sanctum + role:admin
 *   DELETE /api/products/{id}       auth:sanctum + role:admin
 *
 * Query params come from ProductController::index(): search, category_id,
 * stock ('in'|'out'), status, min_price, max_price, in_stock, sort, per_page, page.
 */

/** Sort keys ProductController::index() understands. 'latest' is the default. */
export type ProductSort = 'latest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'popular'

export interface ProductPayload {
  name: string
  category_id: number
  description?: string
  price: number
  stock: number
  /** A path/URL string, or a File for a multipart upload. */
  image?: string | File
}

/** Drop empty values so Axios does not send `category_id=` for cleared inputs. */
function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

export async function getProducts(query: ProductQuery & { stock?: 'in' | 'out' } = {}): Promise<Paginated<Product>> {
  try {
    const res = await client.get('/products', { params: cleanParams({ ...query }) })
    const page = normalizePaginated<unknown>(res.data)

    return { ...page, data: normalizeProducts(page.data) }
  } catch (error) {
    throw toApiError(error, 'Failed to load products')
  }
}

/** The admin table uses the same endpoint with the admin-only filter keys. */
export async function getAdminProducts(query: AdminProductQuery = {}): Promise<Paginated<Product>> {
  return getProducts(query as ProductQuery & { stock?: 'in' | 'out' })
}

export async function getProduct(id: number | string): Promise<Product> {
  try {
    const res = await client.get(`/products/${id}`)
    return normalizeProduct(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Product not found')
  }
}

export async function getRelatedProducts(id: number | string, limit = 4): Promise<Product[]> {
  try {
    const res = await client.get(`/products/${id}/related`, { params: { limit } })
    return normalizeProducts(res.data?.data).slice(0, limit)
  } catch (error) {
    throw toApiError(error, 'Failed to load related products')
  }
}

/**
 * Best sellers, ranked by the units actually sold in non-cancelled orders.
 * The server caps the page at 12, so the home page asks for its 8.
 */
export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  try {
    const res = await client.get('/products/trending', { params: { limit } })
    return normalizeProducts(res.data?.data).slice(0, limit)
  } catch (error) {
    throw toApiError(error, 'Failed to load trending products')
  }
}

/**
 * A File has to go out as multipart/form-data. Axios builds the boundary
 * itself, so Content-Type is deliberately not set by hand here.
 */
function isMultipart(payload: ProductPayload): boolean {
  return payload.image instanceof File
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  try {
    const res = isMultipart(payload)
      ? await client.post('/products', toFormData(payload))
      : await client.post('/products', payload)

    return normalizeProduct(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to create product')
  }
}

export async function updateProduct(id: number | string, payload: ProductPayload): Promise<Product> {
  try {
    // A file must go out as POST: PHP only parses a multipart body for POST, so
    // a raw PUT arrives with an empty body and the backend keeps the old image.
    const res = isMultipart(payload)
      ? await client.post(`/products/${id}`, toFormData(payload))
      : await client.put(`/products/${id}`, payload)

    return normalizeProduct(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to update product')
  }
}

export async function deleteProduct(id: number | string): Promise<void> {
  try {
    await client.delete(`/products/${id}`)
  } catch (error) {
    throw toApiError(error, 'Failed to delete product')
  }
}

function toFormData(payload: ProductPayload): FormData {
  const form = new FormData()

  form.append('name', payload.name)
  form.append('category_id', String(payload.category_id))
  form.append('price', String(payload.price))
  form.append('stock', String(payload.stock))

  if (payload.description) form.append('description', payload.description)
  if (payload.image instanceof File) form.append('image', payload.image)

  return form
}
