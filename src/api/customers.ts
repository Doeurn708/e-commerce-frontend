import { client, toApiError } from './client'
import { normalizeAdminOrder, normalizeCustomer, normalizeOrders, normalizePaginated } from './helpers'
import type { AdminOrder, AdminOrderQuery, AdminUserQuery, Customer, Paginated } from '../types'

/**
 * ---------------------------------------------------------------------------
 * Users (admin) API
 * ---------------------------------------------------------------------------
 * Endpoints — every one is auth:sanctum and gated to role=admin inside
 * UsersController:
 *   GET    /api/users
 *   GET    /api/users/{id}
 *   POST   /api/users
 *   PUT    /api/users/{id}
 *   PATCH  /api/users/{id}
 *   DELETE /api/users/{id}
 *
 * Filters: search, role ('customer'|'admin'), status ('active'|'suspended'),
 * sort ('name_asc'|'name_desc'|'spent_desc'|'orders_desc'), page, per_page.
 */

function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

export async function getCustomers(query: AdminUserQuery = {}): Promise<Paginated<Customer>> {
  try {
    const res = await client.get('/users', { params: cleanParams({ ...query }) })
    const page = normalizePaginated<unknown>(res.data)

    return { ...page, data: page.data.map(normalizeCustomer) }
  } catch (error) {
    throw toApiError(error, 'Failed to load customers')
  }
}

export async function getCustomer(id: number | string): Promise<Customer> {
  try {
    const res = await client.get(`/users/${id}`)
    return normalizeCustomer(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Customer not found')
  }
}

export interface CustomerPayload {
  name: string
  email: string
  role?: 'customer' | 'admin'
  is_active?: boolean
  password?: string
  password_confirmation?: string
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  try {
    const res = await client.post('/users', payload)
    return normalizeCustomer(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to create customer')
  }
}

/** `password` is optional: leave it blank to keep the current one. */
export async function updateCustomer(id: number | string, payload: Partial<CustomerPayload>): Promise<Customer> {
  try {
    const res = await client.put(`/users/${id}`, payload)
    return normalizeCustomer(res.data?.data)
  } catch (error) {
    throw toApiError(error, 'Failed to update customer')
  }
}

export async function deleteCustomer(id: number | string): Promise<void> {
  try {
    await client.delete(`/users/${id}`)
  } catch (error) {
    throw toApiError(error, 'Failed to delete customer')
  }
}
