export function fadeImageBottom(src, { fadeFraction = 0.09 } = {}) {
  return new Promise((resolve) => {
    if (!src || typeof document === 'undefined') return resolve(src)

    const img = new window.Image()
    // Needs the photo host to send Access-Control-Allow-Origin, otherwise the
    // canvas is tainted and toDataURL throws (we fall back to the raw src).
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const fadeH = Math.max(1, Math.round(h * fadeFraction))
        const grad = ctx.createLinearGradient(0, h - fadeH, 0, h)
        grad.addColorStop(0, 'rgba(0,0,0,0)') // top of band: keep pixels
        grad.addColorStop(1, 'rgba(0,0,0,1)') // bottom edge: erase pixels
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = grad
        ctx.fillRect(0, h - fadeH, w, fadeH)

        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(src)
      }
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}