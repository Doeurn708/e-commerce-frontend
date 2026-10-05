import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

/**
 * ---------------------------------------------------------------------------
 * Central API configuration
 * ---------------------------------------------------------------------------
 * This is the ONLY Axios instance in the app. Every request in `src/api/*`
 * goes through it, so the bearer token is attached automatically and every
 * error is normalised in one place.
 */

/** Laravel REST API root, e.g. http://127.0.0.1:8000/api */
export const API_URL: string = import.meta.env.VITE_API_BASE_URL

/** Laravel origin without /api, e.g. http://127.0.0.1:8000 */
export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL

export const TOKEN_KEY = 'ecommerce_token'
export const USER_KEY = 'ecommerce_user'

const isDev = import.meta.env.DEV

/** Shape of the Laravel error body. */
export interface LaravelErrorBody {
  message?: string
  errors?: Record<string, string[]>
  exception?: string
  file?: string
  line?: number
  trace?: string[]
}

/**
 * Called by the response interceptor when the API answers 401 so the app can
 * drop the session and send the visitor to /login. Registered from the router
 * to avoid a circular import (router -> auth store -> api -> client -> router).
 */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler
}

/** Read the Sanctum token saved at login. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** Persist (or clear) the Sanctum token. */
export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/** Read the cached user profile. */
export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/** Persist (or clear) the cached user profile. */
export function setStoredUser(user: unknown | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

/** Forget the session entirely (used on logout and on a 401). */
export function clearSession(): void {
  setToken(null)
  setStoredUser(null)
}

export const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  // No global Content-Type: it is set per request so that FormData uploads keep
  // the multipart boundary that Axios generates itself.
  headers: { Accept: 'application/json' },
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

/**
 * Development logging must never leak credentials. Passwords, tokens and OTP
 * codes are replaced before the payload reaches the console; a FormData body is
 * summarised by its field names only, because its values are files.
 */
const SENSITIVE_FIELDS = new Set(['password', 'password_confirmation', 'token', 'otp', 'secret'])

function redact(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return `[FormData: ${[...value.keys()].join(', ')}]`
  }

  if (Array.isArray(value)) return value.map(redact)

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      SENSITIVE_FIELDS.has(key) ? '[redacted]' : redact(val),
    ]),
  )
}

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<LaravelErrorBody>) => {
    const status = error.response?.status ?? 0
    const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
    const url = error.config?.url ?? 'unknown'

    if (isDev) {
      // Development only. Never print the Authorization header or the token.
      console.group(`%c[api] ${method} ${url} -> ${status}`, 'color:#e11d48;font-weight:700')
      if (error.config?.data) {
        console.log('payload:', redact(error.config.data))
      }
      console.log('message:', error.response?.data?.message ?? error.message)
      if (error.response?.data?.errors) {
        console.log('validation:', error.response.data.errors)
      }
      console.groupEnd()
    }

    if (status === 401) {
      // The token is gone or expired: drop the session and let the app redirect.
      clearSession()
      onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)

/** Field-level messages from a 422, keyed by input name. */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {}

  const errors = (error.response?.data as LaravelErrorBody | undefined)?.errors
  if (!errors) return {}

  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages?.[0] ?? '']))
}

/** First message for a single field, e.g. `email`. */
export function getFieldError(error: unknown, field: string): string {
  return getValidationErrors(error)[field] ?? ''
}

/** A user-safe message for any error, whatever its shape. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<LaravelErrorBody>(error)) {
    const status = error.response?.status
    const serverMessage = error.response?.data?.message

    if (typeof serverMessage === 'string' && serverMessage.trim() !== '') {
      return serverMessage
    }

    switch (status) {
      case 400:
        return 'The request could not be understood.'
      case 401:
        return 'Your session has expired. Please sign in again.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested item could not be found.'
      case 422:
        return Object.values(getValidationErrors(error))[0] ?? 'Please check the form and try again.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
      case 502:
      case 503:
        return 'The server is having trouble right now. Please try again shortly.'
      default:
        return error.message || fallback
    }
  }

  return error instanceof Error ? error.message : fallback
}

/**
 * Turn any failure into an Error carrying the user-facing message, so views can
 * keep their existing `catch (e) { e instanceof Error ? e.message : ... }` code.
 */
export function toApiError(error: unknown, fallback = 'Something went wrong'): Error {
  return new Error(getErrorMessage(error, fallback))
}
