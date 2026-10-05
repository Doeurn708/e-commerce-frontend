import { API_URL, client, toApiError } from './client'
import type { Role } from '../stores/auth'

/**
 * ---------------------------------------------------------------------------
 * Auth API
 * ---------------------------------------------------------------------------
 * Endpoints:
 *   POST /api/register              -> { message, user, token }
 *   POST /api/login                 -> { message, user, token }
 *   POST /api/logout                (auth:sanctum) -> { message }
 *   GET  /api/user                  (auth:sanctum) -> { user }
 *   POST /api/user/profile          (auth:sanctum) -> { message, user }  multipart, avatar upload
 *   PATCH /api/user/profile         (auth:sanctum) -> { message, user }  JSON only
 *   POST /api/otp/send              -> { message }
 *   POST /api/otp/verify            -> { message }
 *   POST /api/reset-password        -> { message }
 *   GET  /api/auth/google           302 to Google
 *   GET  /api/auth/google/callback  redirects back to the SPA with the token
 */

export interface UserDTO {
  id: number
  name: string
  email: string
  /** Real column on users; null when the customer has not filled it in. */
  phone?: string | null
  /** Path on the public disk, e.g. "avatars/ab12.jpg". */
  avatar?: string | null
  /** "/storage/avatars/ab12.jpg" — host-less on purpose, see the note below. */
  avatar_url?: string | null
  /** Server-computed fallback label, e.g. "CL" for "Chandouern Loung". */
  initials?: string | null
  orders_count?: number
  role?: Role
  is_active?: number | boolean
  google_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthResponse {
  token: string
  user: UserDTO
}

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await client.post('/login', payload)
    return toAuthResponse(res.data)
  } catch (error) {
    throw toApiError(error, 'Unable to sign in')
  }
}

export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await client.post('/register', payload)
    return toAuthResponse(res.data)
  } catch (error) {
    throw toApiError(error, 'Unable to create account')
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await client.post('/logout')
  } catch {
    // The token may already be revoked or missing; the SPA clears it either way.
  }
}

export async function apiFetchMe(): Promise<UserDTO> {
  try {
    const res = await client.get('/user')
    // GET /api/user answers { user: {...} }; tolerate a bare user object too.
    const body = res.data as { user?: UserDTO } & Partial<UserDTO>
    const user = (body?.user ?? body) as UserDTO

    if (!user?.id) throw new Error('Invalid response from server')

    return user
  } catch (error) {
    throw toApiError(error, 'Unable to load session')
  }
}

export interface ProfilePayload {
  name: string
  phone?: string | null
  /** A File to upload, or null/undefined to keep the stored avatar. */
  avatar?: File | null
  /** Drop the stored avatar (ignored when a new file is sent). */
  removeAvatar?: boolean
}

/**
 * Save the profile.
 *
 * Uses POST with FormData on purpose: PHP only populates $_POST / $_FILES for
 * multipart bodies on POST, so a PATCH carrying a file arrives with an empty
 * request. Laravel's router also picks the multipart branch from the
 * Content-Type, so this stays correct for text-only edits too.
 */
export async function apiUpdateProfile(payload: ProfilePayload): Promise<UserDTO> {
  try {
    const form = new FormData()
    form.append('name', payload.name)
    form.append('phone', payload.phone ?? '')

    if (payload.removeAvatar && !payload.avatar) {
      form.append('remove_avatar', '1')
    } else if (payload.avatar) {
      form.append('avatar', payload.avatar)
    }

    const res = await client.post('/user/profile', form)

    const body = res.data as { user?: UserDTO } & Partial<UserDTO>
    const user = (body?.user ?? body) as UserDTO

    if (!user?.id) throw new Error('Invalid response from server')

    return user
  } catch (error) {
    throw toApiError(error, 'Unable to update profile')
  }
}

// ---------------------------------------------------------------------------
// Password reset (OTP)
// ---------------------------------------------------------------------------

export async function apiSendOtp(email: string): Promise<void> {
  try {
    await client.post('/otp/send', { email })
  } catch (error) {
    throw toApiError(error, 'Unable to send verification code')
  }
}

export async function apiVerifyOtp(email: string, otp: string): Promise<void> {
  try {
    await client.post('/otp/verify', { email, otp })
  } catch (error) {
    throw toApiError(error, 'Invalid or expired verification code')
  }
}

export async function apiResetPassword(
  email: string,
  password: string,
  passwordConfirmation: string,
  otp: string,
): Promise<void> {
  try {
    await client.post('/reset-password', {
      email,
      password,
      password_confirmation: passwordConfirmation,
      otp,
    })
  } catch (error) {
    throw toApiError(error, 'Unable to reset password')
  }
}

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

/**
 * Kick off the OAuth flow. The browser leaves for Google, Google comes back to
 * Laravel's /api/auth/google/callback, and Laravel redirects to the SPA route
 * below with ?token=&user=. No OAuth secret ever reaches this file.
 */
export function googleAuthUrl(): string {
  return `${API_URL}/auth/google`
}

export function isGoogleCallback(): boolean {
  return typeof window !== 'undefined' && window.location.pathname === '/auth/google/callback'
}

export interface GoogleCallbackParams {
  token: string | null
  user: UserDTO | null
  error: string | null
}

/** Read the payload Laravel appends to the SPA callback URL. */
export function readGoogleCallbackParams(): GoogleCallbackParams {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  let user: UserDTO | null = null
  const rawUser = params.get('user')

  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as UserDTO
    } catch {
      user = null
    }
  }

  return { token, user, error: params.get('error') }
}

function toAuthResponse(body: unknown): AuthResponse {
  const b = (body ?? {}) as { token?: string; user?: UserDTO }
  const token = b.token
  const user = b.user

  if (!token || !user?.id) {
    throw new Error('Invalid response from server')
  }

  return { token, user }
}
