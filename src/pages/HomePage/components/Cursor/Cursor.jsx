import "./Cursor.css";
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

function Cursor() {
  const angleRef = useRef(0)
  const prev = useRef(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  const opacity = useMotionValue(0)
  
  const springConfig = { type: 'spring', damping: 30, stiffness: 400 }
  const sx = useSpring(x, springConfig)
  const sy = useSpring(y, springConfig)
  const sRotate = useSpring(rotate, springConfig)
  const sOpacity = useSpring(opacity, { stiffness: 100, damping: 20 })
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (prev.current === null) {
        // first placement: jump instantly, no spring travel
        x.jump(e.clientX - 13.5)
        y.jump(e.clientY - 24.3)
        sx.jump(e.clientX - 13.5)
        sy.jump(e.clientY - 24.3)
        prev.current = { x: e.clientX, y: e.clientY }
        opacity.set(1)
        return
      }
      const dx = e.clientX - prev.current.x
      const dy = e.clientY - prev.current.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        const target = Math.atan2(dy, dx) * (180 / Math.PI)
        let diff = ((target - angleRef.current) % 360 + 540) % 360 - 180
        angleRef.current += diff
        rotate.set(angleRef.current)
      }
      prev.current = { x: e.clientX, y: e.clientY }
      x.set(e.clientX - 13.5)
      y.set(e.clientY - 24.3)
      opacity.set(0.8)
    }
    window.addEventListener('mousemove', handleMouseMove)
    
    const handleMouseLeave = () => opacity.set(0);
    document.body.addEventListener('mouseleave', handleMouseLeave)

    const handleMouseOut = (e) => {
      if (!e.relatedTarget && !e.toElement) {
        opacity.set(0)
      }
    }
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseout', handleMouseOut);
    }
  }, [])

  return (
    <motion.div
      id="cursor-glow"
      style={{
        x: sx,
        y: sy,
        rotate: sRotate,
        opacity: sOpacity
      }}
    />
  )
}

export default Cursor;