const POST_AUTH_REDIRECT_KEY = 'ecommerce_post_auth_redirect'

/**
 * Remember where to send the user after an external (OAuth) sign-in.
 * The redirect URI is fixed by Google's config, so the intended path cannot
 * travel through the OAuth round trip - it has to wait on this origin.
 */
export function setPostAuthRedirect(path: string) {
  // only allow same-origin paths
  if (!path.startsWith('/') || path.startsWith('//')) return
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path)
}

export function takePostAuthRedirect(fallback: string): string {
  const stored = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY) ?? ''
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
  return stored.startsWith('/') && !stored.startsWith('//') ? stored : fallback
}
