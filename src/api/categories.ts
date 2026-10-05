import { client, toApiError } from './client'
import { normalizeCategories, normalizeCategory, normalizePaginated, normalizeProducts } from './helpers'
import type { AdminCategoryQuery, Category, Paginated, Product, ProductQuery } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Categories API
 * ---------------------------------------------------------------------------
 * Endpoints:
 *   GET    /api/categories                 public. Plain list by default;
 *                                        paginates as soon as page/per_page/
 *                                        search/sort is present.
 *   GET    /api/categories/{id}            public
 *   GET    /api/categories/{id}/products   public, returns { category, paginated }
 *   POST   /api/categories                 auth:sanctum + role:admin
 *   PUT    /api/categories/{id}            auth:sanctum + role:admin
 *   PATCH  /api/categories/{id}            auth:sanctum + role:admin
 *   DELETE /api/categories/{id}            auth:sanctum + role:admin
 */

export interface CategoryPayload {
  name: string
  description?: string
  /** A path/URL string, or a File for a multipart upload. */
  image?: string | File
}

function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await client.get('/categories')
    return normalizeCategories(res.data)
  } catch (error) {
    throw toApiError(error, 'Failed to load categories')
  }
}

export async function getAdminCategories(query: AdminCategoryQuery = {}): Promise<Paginated<Category>> {
  try {
    const res = await client.get('/categories', { params: cleanParams({ ...query }) })
    const page = normalizePaginated<unknown>(res.data)

    return { ...page, data: normalizeCategories(page.data) }
  } catch (error) {
    throw toApiError(error, 'Failed to load categories')
  }
}

export async function getCategory(id: number | string): Promise<Category> {
  try {
    const res = await client.get(`/categories/${id}`)
    return normalizeCategory(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Category not found')
  }
}

export interface CategoryProducts {
  category: Category
  paginated: Paginated<Product>
}

/** CategoryController::products() nests the paginator under `data.paginated`. */
export async function getCategoryProducts(
  categoryId: number | string,
  query: ProductQuery = {},
): Promise<CategoryProducts> {
  try {
    const res = await client.get(`/categories/${categoryId}/products`, { params: cleanParams({ ...query }) })
    const payload = (res.data?.data ?? {}) as { category?: unknown; paginated?: unknown }

    const page = normalizePaginated<unknown>(payload.paginated)

    return {
      category: normalizeCategory(payload.category),
      paginated: { ...page, data: normalizeProducts(page.data) },
    }
  } catch (error) {
    throw toApiError(error, 'Failed to load category products')
  }
}

function isMultipart(payload: CategoryPayload): boolean {
  return payload.image instanceof File
}

function toFormData(payload: CategoryPayload): FormData {
  const form = new FormData()

  form.append('name', payload.name)
  if (payload.description) form.append('description', payload.description)
  if (payload.image instanceof File) form.append('image', payload.image)

  return form
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  try {
    const res = isMultipart(payload)
      ? await client.post('/categories', toFormData(payload))
      : await client.post('/categories', payload)

    return normalizeCategory(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to create category')
  }
}

export async function updateCategory(id: number | string, payload: CategoryPayload): Promise<Category> {
  try {
    // A file must go out as POST: PHP only parses a multipart body for POST, so
    // a raw PUT arrives with an empty $_FILES and the backend silently keeps the
    // old image. JSON-only edits stay on PUT.
    const res = isMultipart(payload)
      ? await client.post(`/categories/${id}`, toFormData(payload))
      : await client.put(`/categories/${id}`, payload)

    return normalizeCategory(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to update category')
  }
}

export async function deleteCategory(id: number | string): Promise<void> {
  try {
    await client.delete(`/categories/${id}`)
  } catch (error) {
    throw toApiError(error, 'Failed to delete category')
  }
}
