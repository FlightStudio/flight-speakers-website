import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function ParallaxImage({
  src,
  alt,
  className = '',
  speed = 0.5,
  scale = 1.2,
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`])
  const scaleValue = useTransform(scrollYProgress, [0, 0.5, 1], [scale, 1, scale])

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.img
        src={src}
        alt={alt}
        style={{
          y,
          scale: scaleValue,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}

export function ParallaxSection({ children, className = '', speed = 0.3 }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -50}px`, `${speed * 50}px`])

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  )
}

export default ParallaxImage
