// Patch window.fetch once so every admin mutating request automatically
// carries the X-CSRF-Token header (read from the csrf_token cookie set on
// login) and credentials: 'include'. This avoids touching every admin
// fetch call site individually.
//
// Public (non-/api/admin/*) requests and safe HTTP methods are passed
// through unchanged.

let installed = false

export function installAdminFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true

  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    if (!url.startsWith('/api/admin')) {
      return originalFetch(input, init)
    }

    const next = { ...init, credentials: init.credentials || 'include' }
    const method = (init.method || 'GET').toUpperCase()
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrf = readCookie('csrf_token')
      if (csrf) {
        next.headers = { ...(init.headers || {}), 'X-CSRF-Token': csrf }
      }
    }
    return originalFetch(input, next)
  }
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}
