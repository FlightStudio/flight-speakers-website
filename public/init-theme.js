// Sets the data-theme attribute before React mounts so users don't see a
// flash of the wrong theme on cold load. Extracted from index.html so the
// page works under a strict CSP (script-src 'self', no 'unsafe-inline').
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark')
