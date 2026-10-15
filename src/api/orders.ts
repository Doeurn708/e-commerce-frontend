import { client, toApiError } from './client'
import { normalizeAdminOrder, normalizeOrders, normalizeOrder, normalizePaginated } from './helpers'
import type { AdminOrder, AdminOrderQuery, CreateOrderPayload, Order, OrderStatus, Paginated } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Orders API
 * ---------------------------------------------------------------------------
 * Endpoints:
 *   GET   /api/orders            auth:sanctum. Customers see their own orders,
 *                                admins see every order (OrderController::index).
 *   POST  /api/orders            auth:sanctum. Stock is checked and decremented
 *                                server-side inside a transaction.
 *   GET   /api/orders/{id}       auth:sanctum. 403 for someone else's order.
 *   PATCH /api/orders/{id}/cancel      owner or admin, pending only
 *   PATCH /api/orders/{id}/status      admin only
 *
 * Re-exported from './categories' for callers that already import category
 * helpers from this module.
 */
export { getCategoryProducts, type CategoryProducts } from './categories'

export interface OrderQuery {
  search?: string
  status?: OrderStatus
  sort?: 'latest' | 'oldest' | 'amount_desc' | 'amount_asc'
  page?: number
  per_page?: number
}

function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

export async function getOrders(query: OrderQuery = {}): Promise<Paginated<Order>> {
  try {
    const res = await client.get('/orders', { params: cleanParams({ ...query }) })
    const page = normalizePaginated<unknown>(res.data)

    return { ...page, data: normalizeOrders(page.data) }
  } catch (error) {
    throw toApiError(error, 'Failed to load orders')
  }
}

export async function getOrder(id: number | string): Promise<Order> {
  try {
    const res = await client.get(`/orders/${id}`)
    return normalizeOrder(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Order not found')
  }
}

/**
 * Build the POST /api/orders body from the cart.
 *
 * The backend validates `items.*.product_id` and `items.*.quantity` only and
 * always prices the order from the database, so nothing else is sent. Product
 * ids are filtered out when missing rather than forwarded as `undefined`,
 * which Laravel would reject with a 422.
 *
 * `latitude`/`longitude` are the delivery location and are required.
 * `shipping_address` is optional and normally omitted: the checkout map is
 * coordinates-only and no street address is ever typed or reverse-geocoded.
 */
export function buildOrderPayload(cart: CartLine[], form: ShippingForm): CreateOrderPayload {
  const items = cart
    .map((line) => ({ product_id: Number(line.product_id), quantity: Number(line.quantity) }))
    .filter((item) => Number.isFinite(item.product_id) && item.product_id > 0)
    .map((item) => ({ product_id: item.product_id, quantity: Math.max(1, Math.trunc(item.quantity)) }))

  const payload: CreateOrderPayload = {
    payment_method: form.payment_method,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    phone: form.phone.trim(),
    city: form.city.trim(),
    province: form.province.trim(),
    postal_code: form.postal_code.trim(),
    items,
  }

  // Only send a street address when a caller genuinely has one. Sending an
  // empty string would fail the backend's `nullable` string rule on some
  // drivers and store a meaningless blank row.
  const address = form.shipping_address?.trim()
  if (address) payload.shipping_address = address

  return payload
}

export interface CartLine {
  product_id: number | string
  quantity: number
}

export interface ShippingForm {
  payment_method: CreateOrderPayload['payment_method']
  /** Optional: the map supplies coordinates, not an address. */
  shipping_address?: string
  latitude: number
  longitude: number
  phone: string
  city: string
  province: string
  postal_code: string
}

/** Client-side guard so an empty cart never reaches the API. */
export function validateCart(cart: CartLine[]): string | null {
  if (cart.length === 0) return 'Your cart is empty.'

  const invalid = cart.some(
    (line) => !Number.isFinite(Number(line.product_id)) || Number(line.product_id) <= 0 || line.quantity < 1,
  )
  if (invalid) return 'Your cart contains an invalid item. Please review it.'

  return null
}

/** Client-side guard mirroring OrderController::store validation. */
export function validateShipping(form: ShippingForm): Record<string, string> {
  const errors: Record<string, string> = {}

  // shipping_address is intentionally not checked: it is optional now.

  // Mirrors 'numeric|between:-90,90' and 'numeric|between:-180,180'. Number.isFinite
  // rejects NaN from an unset pin before the range check would let it through.
  if (!Number.isFinite(form.latitude) || form.latitude < -90 || form.latitude > 90) {
    errors.latitude = 'The latitude must be a number between -90 and 90.'
  }
  if (!Number.isFinite(form.longitude) || form.longitude < -180 || form.longitude > 180) {
    errors.longitude = 'The longitude must be a number between -180 and 180.'
  }

  if (!form.phone.trim()) errors.phone = 'The phone field is required.'
  else if (form.phone.trim().length > 20) errors.phone = 'The phone field must not be greater than 20 characters.'

  return errors
}

export async function placeOrder(payload: CreateOrderPayload): Promise<Order> {
  try {
    const res = await client.post('/orders', payload)
    return normalizeOrder(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to place order')
  }
}

export async function cancelOrder(id: number | string): Promise<Order> {
  try {
    const res = await client.patch(`/orders/${id}/cancel`)
    return normalizeOrder(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to cancel order')
  }
}

export async function getAdminOrders(query: AdminOrderQuery = {}): Promise<Paginated<AdminOrder>> {
  try {
    const res = await client.get('/orders', { params: cleanParams({ ...query }) })
    const page = normalizePaginated<unknown>(res.data)

    return { ...page, data: page.data.map(normalizeAdminOrder) }
  } catch (error) {
    throw toApiError(error, 'Failed to load orders')
  }
}

export async function getAdminOrder(id: number | string): Promise<AdminOrder> {
  try {
    const res = await client.get(`/orders/${id}`)
    return normalizeAdminOrder(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Order not found')
  }
}

/** Admin only. The backend answers 403 for anyone else. */
export async function updateAdminOrderStatus(id: number | string, status: OrderStatus): Promise<AdminOrder> {
  try {
    const res = await client.patch(`/orders/${id}/status`, { status })
    return normalizeAdminOrder(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to update order status')
  }
}

export type { OrderStatus }
