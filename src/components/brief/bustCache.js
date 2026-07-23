const SESSION = Date.now()

export function bustCache(url) {
  if (!/^https?:\/\//.test(url || '')) return url
  return url + (url.includes('?') ? '&' : '?') + `corsbust=${SESSION}`
}