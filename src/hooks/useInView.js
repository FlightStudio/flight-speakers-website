import { useState, useEffect, useRef } from 'react'

export function useInView(options = {}) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
  } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (triggerOnce && hasAnimated) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (triggerOnce) {
            setHasAnimated(true)
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasAnimated])

  return [ref, isInView]
}

export default useInView
