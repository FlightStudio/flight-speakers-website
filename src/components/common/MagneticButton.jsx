import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export function MagneticButton({
  children,
  className = '',
  onClick,
  strength = 0.4,
  ...props
}) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
      {...props}
    >
      <motion.span
        animate={{ x: position.x * 0.3, y: position.y * 0.3 }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.1,
        }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 'inherit' }}
      >
        {children}
      </motion.span>
    </motion.button>
  )
}

export default MagneticButton
