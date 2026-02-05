import { motion } from 'framer-motion'
import { useInView } from '../../hooks/useInView'

export function AnimatedText({
  children,
  className = '',
  as = 'div',
  delay = 0,
  duration = 0.8,
  splitWords = false,
  splitChars = false,
}) {
  const [ref, isInView] = useInView({ threshold: 0.2 })
  const Component = motion[as] || motion.div

  if (splitChars && typeof children === 'string') {
    const chars = children.split('')
    return (
      <Component ref={ref} className={className}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.02,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >
            {char}
          </motion.span>
        ))}
      </Component>
    )
  }

  if (splitWords && typeof children === 'string') {
    const words = children.split(' ')
    return (
      <Component ref={ref} className={className}>
        {words.map((word, i) => (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden' }}>
            <motion.span
              initial={{ y: '100%' }}
              animate={isInView ? { y: 0 } : { y: '100%' }}
              transition={{
                duration: 0.6,
                delay: delay + i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ display: 'inline-block' }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 && '\u00A0'}
          </span>
        ))}
      </Component>
    )
  }

  return (
    <Component
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </Component>
  )
}

export function RevealText({ children, className = '', delay = 0 }) {
  const [ref, isInView] = useInView({ threshold: 0.2 })

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={isInView ? { y: 0 } : { y: '100%' }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function FadeIn({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, isInView] = useInView({ threshold: 0.1 })

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChildren({ children, className = '', staggerDelay = 0.1 }) {
  const [ref, isInView] = useInView({ threshold: 0.1 })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export default AnimatedText
