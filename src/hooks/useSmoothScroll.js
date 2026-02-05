import { useEffect } from 'react'
import Lenis from 'lenis'

let lenisInstance = null

export function useSmoothScroll() {
  useEffect(() => {
    if (lenisInstance) return

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    })

    function raf(time) {
      lenisInstance.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      if (lenisInstance) {
        lenisInstance.destroy()
        lenisInstance = null
      }
    }
  }, [])

  return lenisInstance
}

export function scrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      offset: 0,
      duration: 1.2,
      ...options,
    })
  }
}

export default useSmoothScroll
