import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import {
  TOKEN_KEY,
  USER_KEY,
  clearSession,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../api/client'
import {
  apiFetchMe,
  apiLogin,
  apiLogout,
  apiRegister,
  apiUpdateProfile,
  type ProfilePayload,
  type UserDTO,
} from '../api/auth'

export type Role = 'admin' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  /** Path on the public disk, e.g. "avatars/ab12.jpg". */
  avatar: string | null
  avatar_url: string | null
  initials: string
  orders_count: number
  role: Role
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
}

function toUser(dto: UserDTO): User {
  return {
    id: Number(dto.id),
    name: dto.name,
    email: dto.email,
    phone: dto.phone ?? null,
    avatar: dto.avatar ?? null,
    avatar_url: dto.avatar_url ?? null,
    initials: dto.initials ?? '',
    orders_count: Number(dto.orders_count ?? 0),
    role: dto.role ?? 'customer',
    is_active: dto.is_active ?? true,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  }
}

/**
 * Sessions persisted before the profile fields existed have no phone/avatar
 * keys, so fill in the defaults instead of letting the UI read `undefined`.
 */
function normalizeUser(stored: User | null | undefined): User | null {
  if (!stored?.id) return null

  return {
    ...stored,
    phone: stored.phone ?? null,
    avatar: stored.avatar ?? null,
    avatar_url: stored.avatar_url ?? null,
    initials: stored.initials ?? '',
    orders_count: Number(stored.orders_count ?? 0),
  }
}

/**
 * Single source of truth for the session.
 *
 * `token` and `user` are mirrored into localStorage so a page refresh keeps the
 * visitor signed in; `initializeAuth()` then revalidates that token against
 * GET /api/user on boot.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(normalizeUser(getStoredUser<User>()))
  const token = ref<string | null>(getToken())
  const loading = ref(false)
  const error = ref('')

  function persist(nextUser: User | null, nextToken: string | null): void {
    user.value = nextUser
    token.value = nextToken

    if (nextToken) setToken(nextToken)
    if (nextUser) setStoredUser(nextUser)

    if (!nextToken || !nextUser) clearSession()
  }

  /** Called on app boot: confirm the stored token is still valid. */
  async function initializeAuth(): Promise<void> {
    if (!token.value) {
      clearSession()
      return
    }

    loading.value = true
    error.value = ''

    try {
      const me = await apiFetchMe()
      const confirmed = toUser(me)

      if (confirmed.is_active === false || confirmed.is_active === 0) {
        clearSession()
        user.value = null
        token.value = null
        return
      }

      persist(confirmed, token.value)
    } catch {
      // Expired or revoked token: drop it and let the guest browse the shop.
      clearSession()
      user.value = null
      token.value = null
    } finally {
      loading.value = false
    }
  }

  /** Re-read the profile from the API (after a profile edit, for example). */
  async function fetchUser(): Promise<User | null> {
    if (!token.value) return null

    loading.value = true
    error.value = ''

    try {
      const me = await apiFetchMe()
      const confirmed = toUser(me)
      persist(confirmed, token.value)
      return confirmed
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unable to load session'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Save the profile and write the response straight into the store, so the
   * navbar avatar/name update without a reload or an extra round trip.
   */
  async function updateProfile(payload: ProfilePayload): Promise<User> {
    loading.value = true
    error.value = ''

    try {
      const saved = toUser(await apiUpdateProfile(payload))
      persist(saved, token.value)
      return saved
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unable to update profile'
      throw e instanceof Error ? e : new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string): Promise<User> {    loading.value = true
    error.value = ''

    try {
      const { token: newToken, user: dto } = await apiLogin({ email: email.trim(), password })
      const signedIn = toUser(dto)

      persist(signedIn, newToken)
      return signedIn
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unable to sign in'
      throw e instanceof Error ? e : new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function register(name: string, email: string, password: string): Promise<User> {
    loading.value = true
    error.value = ''

    try {
      const { token: newToken, user: dto } = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: password,
      })
      const created = toUser(dto)

      persist(created, newToken)
      return created
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unable to create account'
      throw e instanceof Error ? e : new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  /** Invalidate the Sanctum token on the server, then clear it locally. */
  async function logout(): Promise<void> {
    loading.value = true

    try {
      await apiLogout()
    } finally {
      clearSession()
      user.value = null
      token.value = null
      error.value = ''
      loading.value = false
    }
  }

  /**
   * Establish a session from a token issued elsewhere (the Google callback).
   * The payload is re-validated against GET /api/user before it is trusted.
   */
  async function loginWithToken(newToken: string, dto: UserDTO): Promise<User> {
    loading.value = true
    error.value = ''

    setToken(newToken)
    token.value = newToken

    try {
      const confirmed = toUser(await apiFetchMe())
      persist(confirmed, newToken)
      return confirmed
    } catch (e) {
      clearSession()
      user.value = null
      token.value = null
      error.value = e instanceof Error ? e.message : 'Google sign-in failed.'
      throw e instanceof Error ? e : new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  /** Called by the Axios 401 interceptor. */
  function clearAuth(): void {
    clearSession()
    user.value = null
    token.value = null
  }

  return {
    // state
    user,
    token,
    loading,
    error,
    // getters
    isAuthenticated: computed(() => Boolean(token.value) && Boolean(user.value)),
    isAdmin: computed(() => user.value?.role === 'admin'),
    isCustomer: computed(() => user.value?.role === 'customer'),
    currentUser: computed(() => user.value),
    currentUserId: computed(() => user.value?.id ?? null),
    // actions
    initializeAuth,
    fetchUser,
    updateProfile,
    login,
    register,
    logout,
    loginWithToken,
    clearAuth,
  }
})

/** Component-facing helper, kept so existing `useAuth()` imports keep working. */
export function useAuth() {
  const store = useAuthStore()
  const { user, loading, error, isAuthenticated, isAdmin, isCustomer, currentUser, currentUserId, token } =
    storeToRefs(store)

  return {
    user,
    currentUser,
    currentUserId,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isCustomer,
    initializeAuth: store.initializeAuth,
    fetchUser: store.fetchUser,
    updateProfile: store.updateProfile,
    login: store.login,
    register: store.register,
    logout: store.logout,
    loginWithToken: store.loginWithToken,
  }
}
