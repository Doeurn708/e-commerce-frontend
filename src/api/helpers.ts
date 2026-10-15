import type {
  AdminOrder,
  AdminOrderItem,
  Category,
  Customer,
  Order,
  OrderItem,
  Paginated,
  PaymentStatus,
  Product,
  Review,
} from '../types'

/**
 * ---------------------------------------------------------------------------
 * Response handling
 * ---------------------------------------------------------------------------
 * Laravel answers in two shapes across this project:
 *
 *   { "success": true, "data": ... }
 *   { "message": "...", "user": ... }        (auth endpoints)
 *   { "user": { ... } }                      (GET /api/user)
 *
 * `unwrap` is the one place that knows about this, so no view has to guess
 * whether the payload lives under `data`.
 */

/** Pull the payload out of a Laravel envelope. */
export function unwrap<T>(body: unknown, fallbackKey = 'data'): T {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>

    if ('data' in record) {
      return record.data as T
    }

    if (fallbackKey in record) {
      return record[fallbackKey] as T
    }
  }

  return body as T
}

/** Laravel's paginator, as returned under `data`. */
interface RawPaginator<T> {
  data: T[]
  total?: number
  current_page?: number
  per_page?: number
  last_page?: number
}

/**
 * Accepts either a paginator object or a plain array and returns one
 * predictable Paginated<T>.
 */
export function normalizePaginated<T>(body: unknown): Paginated<T> {
  const data = unwrap<RawPaginator<T> | T[]>(body)

  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1, per_page: data.length, last_page: 1 }
  }

  const page = (data ?? {}) as RawPaginator<T>
  const list = Array.isArray(page.data) ? page.data : []
  const perPage = page.per_page ?? list.length ?? 1
  const total = page.total ?? list.length

  return {
    data: list,
    total,
    page: page.current_page ?? 1,
    per_page: perPage || 1,
    last_page: page.last_page ?? Math.max(1, Math.ceil(total / (perPage || 1))),
  }
}

/** Accepts either a paginator or a plain array and returns just the rows. */
export function normalizeList<T>(body: unknown): T[] {
  const data = unwrap<RawPaginator<T> | T[]>(body)

  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as RawPaginator<T>).data)) return (data as RawPaginator<T>).data

  return []
}

/**
 * PostgreSQL `decimal` values can arrive as strings. Every entity mapper below
 * runs its money/count fields through this so templates can safely call
 * `.toFixed(2)` and do arithmetic without parsing first.
 */
function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : value == null ? fallback : String(value)
}

function mapCategory(raw: unknown): Category | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const c = raw as Record<string, unknown>
  return {
    id: num(c.id),
    name: str(c.name),
    slug: str(c.slug),
    description: c.description == null ? undefined : str(c.description),
    image: c.image == null ? undefined : str(c.image),
    products_count: c.products_count == null ? undefined : num(c.products_count),
    created_at: c.created_at == null ? undefined : str(c.created_at),
    updated_at: c.updated_at == null ? undefined : str(c.updated_at),
  }
}

export function normalizeCategory(raw: unknown): Category {
  return (
    mapCategory(raw) ?? {
      id: 0,
      name: '',
      slug: '',
    }
  )
}

export function normalizeCategories(raws: unknown): Category[] {
  return normalizeList<unknown>(raws)
    .map(mapCategory)
    .filter((c): c is Category => Boolean(c?.id))
}

function mapProduct(raw: unknown): Product | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const p = raw as Record<string, unknown>
  const id = num(p.id)
  if (!id) return undefined

  return {
    id,
    category_id: num(p.category_id),
    name: str(p.name),
    slug: str(p.slug),
    description: str(p.description),
    price: num(p.price),
    discount_price: p.discount_price == null ? undefined : num(p.discount_price),
    stock: num(p.stock),
    image: p.image == null ? undefined : str(p.image),
    rating: p.rating == null ? undefined : num(p.rating),
    reviews_count: p.reviews_count == null ? undefined : num(p.reviews_count),
    category: mapCategory(p.category),
    created_at: p.created_at == null ? undefined : str(p.created_at),
    updated_at: p.updated_at == null ? undefined : str(p.updated_at),
  }
}

export function normalizeProduct(raw: unknown): Product {
  return (
    mapProduct(raw) ?? {
      id: 0,
      category_id: 0,
      name: '',
      slug: '',
      description: '',
      price: 0,
      stock: 0,
    }
  )
}

export function normalizeProducts(raws: unknown): Product[] {
  return normalizeList<unknown>(raws)
    .map(mapProduct)
    .filter((p): p is Product => Boolean(p?.id))
}

function mapOrderItem(raw: unknown): OrderItem | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const i = raw as Record<string, unknown>
  return {
    id: num(i.id),
    product_id: num(i.product_id),
    quantity: num(i.quantity),
    price: num(i.price),
    product: mapProduct(i.product),
  }
}

/**
 * OrderController::present() aliases the orderItems relation to `items` and
 * adds subtotal/shipping/discount/payment_status, so read those and fall back
 * to the raw columns for anything the backend did not add.
 */
export function normalizeOrder(raw: unknown): Order {
  const o = (raw ?? {}) as Record<string, unknown>
  const items = normalizeList<unknown>(o.items ?? o.orderItems)
    .map(mapOrderItem)
    .filter((i): i is OrderItem => Boolean(i))

  const totalPrice = num(o.total_price)

  return {
    id: num(o.id),
    user_id: num(o.user_id),
    total_price: totalPrice,
    subtotal: o.subtotal == null ? totalPrice : num(o.subtotal),
    shipping: o.shipping == null ? 0 : num(o.shipping),
    discount: o.discount == null ? 0 : num(o.discount),
    status: (str(o.status, 'pending') || 'pending') as Order['status'],
    payment_status: (str(o.payment_status, 'unpaid') || 'unpaid') as Order['payment_status'],
    payment_method: (str(o.payment_method, 'cod') || 'cod') as Order['payment_method'],
    // Null, not '': the checkout map is coordinates-only, so a new order has no
    // street address at all. Preserved as null so the UI can say "no address"
    // instead of printing an empty string next to the coordinates.
    shipping_address: o.shipping_address == null ? null : str(o.shipping_address),
    // Null, not 0: a pre-map order has no coordinates and 0,0 is a real point
    // in the Gulf of Guinea that must never be mistaken for "no pin".
    latitude: o.latitude == null ? null : num(o.latitude),
    longitude: o.longitude == null ? null : num(o.longitude),
    city: str(o.city),
    province: str(o.province),
    postal_code: str(o.postal_code),
    phone: str(o.phone),
    created_at: str(o.created_at),
    items,
  }
}

export function normalizeOrders(raws: unknown): Order[] {
  return normalizeList<unknown>(raws).map(normalizeOrder)
}

/** The admin table/detail views also read `user` and `payment`. */
export function normalizeAdminOrder(raw: unknown): AdminOrder {
  const source = (raw ?? {}) as Record<string, unknown>
  const order = normalizeOrder(raw)
  const items = (normalizeList<unknown>(source.items ?? source.orderItems)
    .map((i) => mapOrderItem(i))
    .filter((i): i is OrderItem => Boolean(i))) as AdminOrderItem[]

  const payment = source.payment as Record<string, unknown> | null | undefined

  return {
    id: order.id,
    user_id: order.user_id,
    total_price: order.total_price,
    status: order.status,
    // Carried through as-is (nullable): the admin detail view already renders
    // a dash when there is no address, which is the coordinates-only case.
    shipping_address: order.shipping_address,
    phone: order.phone,
    created_at: order.created_at,
    items_count: source.items_count == null ? items.length : num(source.items_count),
    user: source.user ? normalizeCustomer(source.user) : undefined,
    orderItems: items,
    items,
    payment: payment
      ? {
          id: num(payment.id) || undefined,
          amount: payment.amount == null ? undefined : num(payment.amount),
          payment_status: (str(payment.payment_status, 'unpaid') || 'unpaid') as PaymentStatus,
          payment_method: payment.payment_method == null ? undefined : str(payment.payment_method),
          transaction_id: payment.transaction_id == null ? undefined : str(payment.transaction_id),
          paid_at: payment.paid_at == null ? null : str(payment.paid_at),
        }
      : null,
  }
}

export function normalizeCustomer(raw: unknown): Customer {
  const u = (raw ?? {}) as Record<string, unknown>

  return {
    id: num(u.id),
    name: str(u.name),
    email: str(u.email),
    role: u.role == null ? undefined : str(u.role),
    phone: u.phone == null ? null : str(u.phone),
    is_active: u.is_active == null ? undefined : Boolean(u.is_active),
    orders_count: u.orders_count == null ? undefined : num(u.orders_count),
    total_spent: u.total_spent == null ? undefined : num(u.total_spent),
    created_at: u.created_at == null ? undefined : str(u.created_at),
  }
}

/**
 * The products table has no review rows, so the detail view renders an empty
 * state instead of the hardcoded samples that used to live in the component.
 */
export function normalizeReviews(raws: unknown): Review[] {
  return normalizeList<Record<string, unknown>>(raws).map((r, index) => {
    const author = r.user as { name?: unknown } | undefined

    return {
      id: num(r.id, index + 1),
      product_id: num(r.product_id),
      user_name: str(r.user_name ?? author?.name, 'Anonymous'),
      rating: num(r.rating),
      comment: str(r.comment),
      created_at: str(r.created_at),
    }
  })
}
