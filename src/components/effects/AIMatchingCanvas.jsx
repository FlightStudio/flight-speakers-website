import { useRef, useEffect } from 'react'

// ============================================================================
// PREMIUM GRADIENT MESH ANIMATION
// Inspired by Linear, Stripe - subtle gradients, smooth motion, restraint
// ============================================================================

export default function AIMatchingCanvas({ stage = 0, hoveredResult = null }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const stateRef = useRef({
    stage: 0,
    hoveredResult: null,
    activeAmount: 0.3,
    mouse: { x: 0.5, y: 0.5 },
    targetMouse: { x: 0.5, y: 0.5 },
    blobs: [
      { x: 0.35, y: 0.5, targetX: 0.35, targetY: 0.5, baseX: 0.35, baseY: 0.5, phase: 0 },
      { x: 0.65, y: 0.45, targetX: 0.65, targetY: 0.45, baseX: 0.65, baseY: 0.45, phase: 2 },
      { x: 0.5, y: 0.55, targetX: 0.5, targetY: 0.55, baseX: 0.5, baseY: 0.55, phase: 4 },
    ]
  })

  // Update state refs (no re-renders)
  useEffect(() => {
    stateRef.current.stage = stage
    stateRef.current.hoveredResult = hoveredResult
  }, [stage, hoveredResult])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        stateRef.current.targetMouse = { x, y }
      }
    }

    const handleMouseLeave = () => {
      stateRef.current.targetMouse = { x: 0.5, y: 0.5 }
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const state = stateRef.current

      time += 0.008 // Slower time progression

      // Smooth activation
      const targetActive = state.stage >= 2 ? 1 : 0.3
      state.activeAmount += (targetActive - state.activeAmount) * 0.02

      // Smooth mouse interpolation
      state.mouse.x += (state.targetMouse.x - state.mouse.x) * 0.03
      state.mouse.y += (state.targetMouse.y - state.mouse.y) * 0.03

      // Clear
      ctx.clearRect(0, 0, width, height)

      // Draw gradient blobs
      state.blobs.forEach((blob, i) => {
        // Gentle oscillation around base position
        const oscillateX = Math.sin(time + blob.phase) * 0.03
        const oscillateY = Math.cos(time * 0.8 + blob.phase) * 0.02

        blob.targetX = blob.baseX + oscillateX
        blob.targetY = blob.baseY + oscillateY

        // Subtle mouse influence (very gentle)
        const mouseDx = (state.mouse.x - 0.5) * 0.05
        const mouseDy = (state.mouse.y - 0.5) * 0.05
        blob.targetX += mouseDx
        blob.targetY += mouseDy

        // Smooth interpolation
        blob.x += (blob.targetX - blob.x) * 0.02
        blob.y += (blob.targetY - blob.y) * 0.02

        // Draw gradient
        const gradient = ctx.createRadialGradient(
          blob.x * width, blob.y * height, 0,
          blob.x * width, blob.y * height, width * 0.35
        )

        const baseOpacity = 0.06 + state.activeAmount * 0.08
        gradient.addColorStop(0, `rgba(34, 197, 94, ${baseOpacity})`)
        gradient.addColorStop(0.6, `rgba(16, 185, 129, ${baseOpacity * 0.4})`)
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      })

      // Draw flow diagram
      drawFlowDiagram(ctx, width, height, state, time)

      animationRef.current = requestAnimationFrame(animate)
    }

    const drawFlowDiagram = (ctx, width, height, state, time) => {
      const centerX = width / 2
      const centerY = height / 2
      const scale = Math.min(width, height) / 400

      const inputActive = state.stage >= 1
      const processingActive = state.stage >= 2
      const outputActive = state.stage >= 3

      // Positions
      const inputNodeX = centerX - 130 * scale
      const inputNodeY = centerY
      const centerRadius = 32 * scale
      const outputNodeX = centerX + 130 * scale
      const outputSpacing = 35 * scale

      // Input line
      drawLine(ctx, inputNodeX, inputNodeY, centerX - centerRadius - 10 * scale, centerY, inputActive, scale)
      drawNode(ctx, inputNodeX, inputNodeY, inputActive, false, scale)

      // Processing ring
      drawProcessingRing(ctx, centerX, centerY, centerRadius, processingActive, state.activeAmount, time, scale)

      // Output lines
      const outputY1 = centerY - outputSpacing
      const outputY2 = centerY
      const outputY3 = centerY + outputSpacing

      drawLine(ctx, centerX + centerRadius + 10 * scale, centerY, outputNodeX, outputY1, outputActive, scale)
      drawLine(ctx, centerX + centerRadius + 10 * scale, centerY, outputNodeX, outputY2, outputActive, scale)
      drawLine(ctx, centerX + centerRadius + 10 * scale, centerY, outputNodeX, outputY3, outputActive, scale)

      // Output nodes
      drawNode(ctx, outputNodeX, outputY1, outputActive, state.hoveredResult === 0, scale)
      drawNode(ctx, outputNodeX, outputY2, outputActive, state.hoveredResult === 1, scale)
      drawNode(ctx, outputNodeX, outputY3, outputActive, state.hoveredResult === 2, scale)

      // Traveling dots (only when active)
      if (inputActive) {
        drawTravelingDot(ctx, inputNodeX, inputNodeY, centerX - centerRadius - 10 * scale, centerY, time, 0, scale)
      }
      if (outputActive) {
        drawTravelingDot(ctx, centerX + centerRadius + 10 * scale, centerY, outputNodeX, outputY1, time, 0, scale)
        drawTravelingDot(ctx, centerX + centerRadius + 10 * scale, centerY, outputNodeX, outputY2, time, 0.33, scale)
        drawTravelingDot(ctx, centerX + centerRadius + 10 * scale, centerY, outputNodeX, outputY3, time, 0.66, scale)
      }
    }

    const drawLine = (ctx, x1, y1, x2, y2, active, scale) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = active ? 'rgba(200, 200, 200, 0.6)' : 'rgba(220, 220, 220, 0.4)'
      ctx.lineWidth = 1 * scale
      ctx.stroke()
    }

    const drawNode = (ctx, x, y, active, highlighted, scale) => {
      const radius = (highlighted ? 6 : 4.5) * scale

      // Glow
      if (active) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4)
        glow.addColorStop(0, 'rgba(34, 197, 94, 0.2)')
        glow.addColorStop(1, 'rgba(34, 197, 94, 0)')
        ctx.beginPath()
        ctx.arc(x, y, radius * 4, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }

      // Node
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = active ? '#22c55e' : '#e5e5e5'
      ctx.fill()
    }

    const drawTravelingDot = (ctx, x1, y1, x2, y2, time, offset, scale) => {
      const progress = (time * 0.4 + offset) % 1
      const x = x1 + (x2 - x1) * progress
      const y = y1 + (y2 - y1) * progress

      // Glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 8 * scale)
      glow.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
      glow.addColorStop(1, 'rgba(34, 197, 94, 0)')
      ctx.beginPath()
      ctx.arc(x, y, 8 * scale, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Dot
      ctx.beginPath()
      ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2)
      ctx.fillStyle = '#22c55e'
      ctx.fill()
    }

    const drawProcessingRing = (ctx, x, y, radius, active, activeAmount, time, scale) => {
      // Outer ring
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = active ? 'rgba(34, 197, 94, 0.25)' : 'rgba(220, 220, 220, 0.4)'
      ctx.lineWidth = 1.5 * scale
      ctx.stroke()

      if (active && activeAmount > 0.5) {
        // Rotating arc 1
        const angle1 = time * 1.5
        ctx.beginPath()
        ctx.arc(x, y, radius, angle1, angle1 + Math.PI * 0.6)
        ctx.strokeStyle = `rgba(34, 197, 94, ${activeAmount * 0.7})`
        ctx.lineWidth = 2 * scale
        ctx.lineCap = 'round'
        ctx.stroke()

        // Rotating arc 2 (inner, opposite)
        const angle2 = -time * 1.2
        ctx.beginPath()
        ctx.arc(x, y, radius - 8 * scale, angle2, angle2 + Math.PI * 0.5)
        ctx.strokeStyle = `rgba(16, 185, 129, ${activeAmount * 0.5})`
        ctx.lineWidth = 1.5 * scale
        ctx.stroke()

        // Center dot
        ctx.beginPath()
        ctx.arc(x, y, 3.5 * scale, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + activeAmount * 0.4})`
        ctx.fill()
      }

      ctx.lineCap = 'butt' // Reset
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="ai-canvas">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
