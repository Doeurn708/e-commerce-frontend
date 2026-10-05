import { client, toApiError } from './client'
import { normalizeAdminOrder, normalizeProduct } from './helpers'
import type { DashboardData } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Dashboard API
 * ---------------------------------------------------------------------------
 * GET /api/admin/dashboard — auth:sanctum + role:admin.
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     stats: {...},
 *     recent_orders: [...],
 *     recent_products: [...],
 *     low_stock_products: [...]
 *   }
 * }
 */

export async function getDashboardStats(): Promise<DashboardData> {
  try {
    const res = await client.get('/admin/dashboard')
    const payload = (res.data?.data ?? {}) as { [k: string]: unknown }

    const stats = (payload.stats ?? {}) as DashboardData['stats']

    const recentOrders = Array.isArray(payload.recent_orders)
      ? (payload.recent_orders.map((o: unknown) => normalizeAdminOrder(o)) as DashboardData['recent_orders'])
      : []

    const recentProducts = Array.isArray(payload.recent_products)
      ? (payload.recent_products.map((p: unknown) => normalizeProduct(p)) as DashboardData['recent_products'])
      : []

    const lowStockProducts = Array.isArray(payload.low_stock_products)
      ? (payload.low_stock_products.map((p: unknown) => normalizeProduct(p)) as DashboardData['low_stock_products'])
      : []

    return {
      stats: {
        products_total: Number(stats.products_total ?? 0),
        categories_total: Number(stats.categories_total ?? 0),
        orders_total: Number(stats.orders_total ?? 0),
        customers_total: Number(stats.customers_total ?? 0),
        users_total: Number(stats.users_total ?? 0),
        revenue_total: Number(stats.revenue_total ?? 0),
        pending_orders: Number(stats.pending_orders ?? 0),
        low_stock_total: Number(stats.low_stock_total ?? 0),
      },
      recent_orders: recentOrders,
      recent_products: recentProducts,
      low_stock_products: lowStockProducts,
    }
  } catch (error) {
    throw toApiError(error, 'Failed to load dashboard data')
  }
}
