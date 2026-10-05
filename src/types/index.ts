export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
export type PaymentMethod = 'cod' | 'online'
export type ProductStatus = 'active' | 'inactive'

export function isOrderStatus(value: unknown): value is OrderStatus {
  return value === 'pending' || value === 'processing' || value === 'completed' || value === 'cancelled'
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  products_count?: number
  created_at?: string
  updated_at?: string
  products?: Product[]
}

export interface Product {
  id: number
  category_id: number
  name: string
  slug: string
  description: string
  price: number
  discount_price?: number
  stock: number
  image?: string
  rating?: number
  reviews_count?: number
  category?: Category
  created_at?: string
  updated_at?: string
}

export interface ProductView {
  id: number
  name: string
  slug?: string
  description?: string
  price: number
  discount_price?: number
  stock?: number
  image?: string
  rating?: number
  reviews?: number
  reviews_count?: number
  category_id?: number
  category?: string | Category
}

export interface ProductQuery {
  search?: string
  category_id?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  per_page?: number
}

export interface AdminProductQuery {
  search?: string
  category_id?: number
  stock?: 'in' | 'out'
  status?: ProductStatus
  sort?: 'latest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'
  page?: number
  per_page?: number
}

export type AdminCategorySort = 'latest' | 'name' | 'products'

export interface AdminCategoryQuery {
  search?: string
  sort?: AdminCategorySort
  page?: number
  per_page?: number
}

export type AdminOrderSort = 'latest' | 'oldest' | 'amount_desc' | 'amount_asc'

export interface AdminOrderQuery {
  search?: string
  status?: OrderStatus
  date?: string
  sort?: AdminOrderSort
  page?: number
  per_page?: number
}

export type AdminUserSort = 'latest' | 'name_asc' | 'name_desc' | 'spent_desc' | 'orders_desc'

export interface AdminUserQuery {
  search?: string
  role?: 'customer' | 'admin'
  status?: 'active' | 'suspended'
  sort?: AdminUserSort
  page?: number
  per_page?: number
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  last_page: number
}

export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  price: number
  product?: Product
}

export interface Order {
  id: number
  user_id: number
  total_price: number
  subtotal: number
  shipping: number
  discount: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  shipping_address: string
  /** Null on orders placed before the checkout map existed. */
  latitude: number | null
  longitude: number | null
  city: string
  province: string
  postal_code: string
  phone: string
  created_at: string
  items: OrderItem[]
}

export interface AdminOrderItem {
  id: number
  product_id: number
  quantity: number
  price: number
  product?: Product
}

export interface OrderPayment {
  id?: number
  amount?: number
  payment_status?: PaymentStatus
  payment_method?: string
  transaction_id?: string
  paid_at?: string | null
}

export interface Customer {
  id: number
  name: string
  email: string
  role?: string
  phone?: string | null
  is_active?: boolean
  orders_count?: number
  total_spent?: number
  created_at?: string
  updated_at?: string
}

export interface AdminOrder {
  id: number
  user_id: number
  total_price: number
  status: OrderStatus
  shipping_address: string
  phone: string
  created_at?: string
  updated_at?: string
  items_count?: number
  user?: Customer
  orderItems?: AdminOrderItem[]
  items?: AdminOrderItem[]
  payment?: OrderPayment | null
}

export interface DashboardStats {
  products_total: number
  categories_total: number
  orders_total: number
  customers_total: number
  users_total: number
  revenue_total: number
  pending_orders: number
  low_stock_total: number
}

export interface DashboardData {
  stats: DashboardStats
  recent_orders: AdminOrder[]
  recent_products: Product[]
  low_stock_products: Product[]
}

export interface CreateOrderPayload {
  payment_method: PaymentMethod
  /** Human-readable label picked on the checkout map. */
  shipping_address: string
  /** Pin coordinates. OrderController::store requires both alongside the address. */
  latitude: number
  longitude: number
  phone: string
  city?: string
  province?: string
  postal_code?: string
  items: { product_id: number; quantity: number }[]
}

/** What the checkout map reports back after a pin is placed or moved. */
export interface SelectedLocation {
  latitude: number
  longitude: number
  address: string
}

export interface CartItemDto {
  product_id: number
  quantity: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface Review {
  id: number
  product_id: number
  user_name: string
  rating: number
  comment: string
  created_at: string
}