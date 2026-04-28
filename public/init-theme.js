// Sets the data-theme attribute and accessibility preferences before React
// mounts so users don't see a flash of the wrong theme or unstyled state on
// cold load. Extracted from index.html so the page works under a strict CSP
// (script-src 'self', no 'unsafe-inline').
(function () {
  var html = document.documentElement
  html.setAttribute('data-theme', localStorage.getItem('theme') || 'dark')

  try {
    var raw = localStorage.getItem('a11y-prefs')
    if (raw) {
      var prefs = JSON.parse(raw)
      if (prefs.largeText) html.classList.add('a11y-large-text')
      if (prefs.highContrast) html.classList.add('a11y-high-contrast')
      if (prefs.reduceMotion) html.classList.add('a11y-reduce-motion')
      if (prefs.underlineLinks) html.classList.add('a11y-underline-links')
    }
  } catch (e) {}
})()
