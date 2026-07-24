export function prepareBriefImage(
  src,
  { maxWidth = 0, fadeBottom = false, fadeFraction = 0.09, mime = 'image/png', quality = 0.85 } = {},
) {
  return new Promise((resolve) => {
    if (!src || typeof document === 'undefined') return resolve(src)

    const img = new window.Image()
    // Needs the photo host to send Access-Control-Allow-Origin, otherwise the
    // canvas is tainted and toDataURL throws (we fall back to the raw src).
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (maxWidth && w > maxWidth) {
          h = Math.round(h * (maxWidth / w))
          w = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        if (fadeBottom) {
          const fadeH = Math.max(1, Math.round(h * fadeFraction))
          const grad = ctx.createLinearGradient(0, h - fadeH, 0, h)
          grad.addColorStop(0, 'rgba(0,0,0,0)') // top of band: keep pixels
          grad.addColorStop(1, 'rgba(0,0,0,1)') // bottom edge: erase pixels
          // destination-out erases existing pixels in proportion to the paint's
          // alpha, so alpha ramps 0→1 down the band, fading the image to nothing.
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = grad
          ctx.fillRect(0, h - fadeH, w, fadeH)
        }

        resolve(canvas.toDataURL(mime, quality))
      } catch {
        resolve(src)
      }
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

// Thin wrapper — the main speaker cutout, faded into the spotlight behind it.
export function fadeImageBottom(src, opts = {}) {
  return prepareBriefImage(src, { fadeBottom: true, ...opts })
}