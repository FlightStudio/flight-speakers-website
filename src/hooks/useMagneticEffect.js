import { useRef, useEffect, useCallback } from 'react'

export function useMagneticEffect(strength = 0.3) {
  const ref = useRef(null)

  const handleMouseMove = useCallback((e) => {
    const element = ref.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
  }, [strength])

  const handleMouseLeave = useCallback(() => {
    const element = ref.current
    if (!element) return

    element.style.transform = 'translate(0, 0)'
    element.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'

    setTimeout(() => {
      if (element) {
        element.style.transition = ''
      }
    }, 500)
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return ref
}

export default useMagneticEffect
