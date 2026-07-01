import "./EnhancedAIDemo.css";

import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'
import {
  motion,
  useInView
} from 'framer-motion'
import { Link } from 'react-router-dom'

import { EASE } from '../../../../../../constants/animation'

// Enhanced AI Matching Demo — pipeline inside window
function EnhancedAIDemo({ speakers: allSpeakers = [] }) {
  const containerRef = useRef(null)
  const svgWrapRef = useRef(null)
  const tokenElRefs = useRef([])
  const isInView = useInView(containerRef, { once: true, amount: 0.5 })
  const [phase, setPhase] = useState(0)
  // Real pixel-space SVG geometry. Tracks the SVG wrap's actual size and
  // recomputes paths from measured token positions, so curves don't stretch
  // when the window resizes — they follow the pills exactly.
  const [geom, setGeom] = useState({ w: 0, h: 0, paths: [] })
  const timersRef = useRef([])
  const runIdRef = useRef(0)

  // Non-purple palette: brand accent + slate / sky / teal / gold.
  const tokens = [
    { label: 'Leadership', color: '#94a3b8' },     // slate
    { label: '500 execs', color: '#38bdf8' },      // sky
    { label: 'Sales kickoff', color: '#14b8a6' },  // teal
    { label: 'Motivational', color: '#E85D4C' },   // brand accent
    { label: 'Q3', color: '#C9A227' },             // brand gold
  ]

  const demoConfig = [
    { id: 'nir-eyal', topic: 'Behaviour Design & Focus', score: 98 },
    { id: 'evy-poumpouras', topic: 'Leadership & Decision Making', score: 94 },
    { id: 'paul-c-brunson', topic: 'Emotional Intelligence', score: 91 },
  ]
  const results = demoConfig.map(d => {
    const sp = allSpeakers.find(s => s.id === d.id)
    return { name: sp?.name || d.id, topic: d.topic, score: d.score, photo: sp?.photo || '' }
  })

  const brief = 'We need a high-energy leadership speaker for our Q3 sales kickoff with 500 executives...'
  const [typedText, setTypedText] = useState('')

  // Timing constants
  const TOKEN_STAGGER = 600      // ms between each token appearing
  const PATH_DRAW_DUR = 1.0      // seconds for each path line to draw
  const DOT_DUR = 2.2            // seconds for each dot to travel
  const DOT_STAGGER = 0.55       // seconds between each dot dispatching

  // When everything is visible (all tokens + all paths drawn)
  const LAST_TOKEN_DELAY = (tokens.length - 1) * (TOKEN_STAGGER / 1000) // 2.4s
  const ALL_VISIBLE_AT = LAST_TOKEN_DELAY + 0.45 + PATH_DRAW_DUR       // ~3.85s after phase 2
  // Dots dispatch after everything is visible
  const DOTS_START = ALL_VISIBLE_AT + 0.3                               // ~4.15s after phase 2
  const LAST_DOT_DONE = DOTS_START + (tokens.length - 1) * DOT_STAGGER + DOT_DUR // ~8.55s after phase 2

  // Build a smooth bezier in pixel coords, from (sx, 0) → (endX, endY).
  // Outer tokens get more dramatic S-curves. Pure pixels — no viewBox warp.
  const buildPath = useCallback((sx, w, h) => {
    const endX = w / 2
    const endY = h - 4
    const dx = Math.abs(sx - endX)
    const spread = w === 0 ? 0 : dx / (w / 2) // 0 = center, 1 = edge
    const cp1x = sx
    const cp1y = endY * (0.55 + spread * 0.15)
    const cp2x = endX
    const cp2y = endY * (0.35 + spread * 0.1)
    return `M${sx.toFixed(1)},0 C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
  }, [])

  // Measure SVG wrap + token centres → pixel-space paths.
  const measurePaths = useCallback(() => {
    const wrap = svgWrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    if (rect.width === 0) return

    const w = rect.width
    const h = rect.height

    const measured = tokenElRefs.current.map((el) => {
      if (!el) return null
      const elRect = el.getBoundingClientRect()
      const sx = (elRect.left + elRect.width / 2) - rect.left
      return buildPath(sx, w, h)
    })

    if (measured.every(Boolean)) setGeom({ w, h, paths: measured })
  }, [buildPath])

  // ResizeObserver on the SVG wrap is much smoother than a window resize
  // listener — fires per-element with browser-coalesced rAF cadence, so the
  // curves stay glued to the pills throughout the gesture.
  useEffect(() => {
    const wrap = svgWrapRef.current
    if (!wrap || typeof ResizeObserver === 'undefined') {
      // Legacy fallback (very old browsers).
      const fallback = () => requestAnimationFrame(measurePaths)
      window.addEventListener('resize', fallback)
      fallback()
      return () => window.removeEventListener('resize', fallback)
    }
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measurePaths)
    })
    ro.observe(wrap)
    // Also re-measure when each token element changes size (font load, etc.)
    tokenElRefs.current.forEach(el => el && ro.observe(el))
    document.fonts?.ready?.then(() => requestAnimationFrame(measurePaths))
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [measurePaths])

  // Fallback paths until first measurement lands (avoids a flash of nothing).
  const paths = geom.paths.length === tokens.length
    ? geom.paths
    : tokens.map((_, i) => {
        const w = geom.w || 600
        const h = geom.h || 140
        const sx = (i + 1) * (w / (tokens.length + 1))
        return buildPath(sx, w, h)
      })

  useEffect(() => {
    if (isInView) {
      runIdRef.current++
      setPhase(0)
      setTypedText('')
      timersRef.current.forEach(clearTimeout)
      // Re-measure paths after reset (tokens still in DOM at opacity 0)
      requestAnimationFrame(() => requestAnimationFrame(measurePaths))
      const phase2At = 2800
      const t = []
      t.push(setTimeout(() => setPhase(1), 300))
      t.push(setTimeout(() => {
        setPhase(2)
        // Re-measure again when tokens animate into position
        requestAnimationFrame(measurePaths)
      }, phase2At))
      // Star pulses when dots start traveling
      t.push(setTimeout(() => setPhase(3), phase2At + DOTS_START * 1000))
      // Results appear right after last dot arrives
      t.push(setTimeout(() => setPhase(4), phase2At + LAST_DOT_DONE * 1000 + 200))
      timersRef.current = t
    } else {
      timersRef.current.forEach(clearTimeout)
      setPhase(0)
      setTypedText('')
    }
    return () => timersRef.current.forEach(clearTimeout)
  }, [isInView, measurePaths])

  useEffect(() => {
    if (phase !== 1) return
    let i = 0
    const iv = setInterval(() => { i++; setTypedText(brief.slice(0, i)); if (i >= brief.length) clearInterval(iv) }, 26)
    return () => clearInterval(iv)
  }, [phase])

  return (
    <div className="ai-pipe" ref={containerRef}>
      {/* Search bar — starts compact and centered, expands to full width */}
      <motion.div
        className="ai-pipe__search"
        initial={{ width: '60%' }}
        animate={phase >= 1 ? { width: '100%' } : { width: '60%' }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ margin: '0 auto' }}
      >
        <svg className="ai-pipe__search-icon" width="14" height="14" viewBox="0 0 22 22" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div className="ai-pipe__search-text">
          {typedText || <span className="ai-pipe__placeholder">Describe your ideal speaker...</span>}
          {phase === 1 && <span className="ai-pipe__cursor" />}
        </div>
      </motion.div>

      {/* Visualization — tokens, paths, convergence */}
      <motion.div
        className="ai-pipe__viz"
        initial={false}
        animate={phase >= 2
          ? {
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0%)',
            }
          : {
              opacity: 0,
              clipPath: 'inset(0% 0% 100% 0%)',
            }
        }
        transition={{ duration: 0.6, ease: EASE }}
        onAnimationComplete={() => {
          if (phase >= 2) requestAnimationFrame(measurePaths)
        }}
      >
        {/* Token pills */}
        <div className="ai-pipe__token-row">
          {tokens.map((tk, i) => (
            <motion.span
              key={`${tk.label}-${runIdRef.current}`}
              ref={el => { tokenElRefs.current[i] = el }}
              className="ai-pipe__token"
              style={{ '--tk': tk.color }}
              initial={{ opacity: 0, y: -6 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * (TOKEN_STAGGER / 1000), duration: 0.45, ease: EASE }}
            >
              {tk.label}
            </motion.span>
          ))}
        </div>

        {/* SVG wrap — sized by CSS, paths use pixel coords matching this rect.
            No viewBox = no aspect-ratio stretch when window resizes. */}
        <div className="ai-pipe__paths-wrap" ref={svgWrapRef}>
          <svg className="ai-pipe__paths" width="100%" height="100%">
            {/* Lines — draw with each token, staggered */}
            {paths.map((d, i) => (
              <motion.path
                key={`line-${i}-${runIdRef.current}`}
                d={d}
                stroke={tokens[i].color}
                strokeWidth="1.5"
                strokeOpacity="0"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={phase >= 2 ? { pathLength: 1, strokeOpacity: 0.4 } : {}}
                transition={{
                  pathLength: { delay: i * (TOKEN_STAGGER / 1000) + 0.3, duration: PATH_DRAW_DUR, ease: EASE },
                  strokeOpacity: { delay: i * (TOKEN_STAGGER / 1000) + 0.3, duration: 0.3 },
                }}
              />
            ))}

            {/* Dots — dispatch AFTER all tokens + paths are visible */}
            {phase >= 2 && paths.length === tokens.length && tokens.map((tk, i) => {
              const begin = `${DOTS_START + i * DOT_STAGGER}s`
              const dur = `${DOT_DUR}s`
              return (
                <circle
                  key={`dot-${i}-${runIdRef.current}-${geom.w}`}
                  r="4" fill={tk.color} opacity="0"
                >
                  <animateMotion
                    dur={dur} begin={begin} fill="freeze" path={paths[i]}
                    calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1"
                  />
                  <animate attributeName="opacity" values="0;0.85;0.85;0" keyTimes="0;0.04;0.75;1" dur={dur} begin={begin} fill="freeze" />
                  <animate attributeName="r" values="3;4.5;4;2" keyTimes="0;0.05;0.8;1" dur={dur} begin={begin} fill="freeze" />
                </circle>
              )
            })}
          </svg>
        </div>

        {/* Analyzing orb at convergence */}
        <motion.div
          className="ai-pipe__orb"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            phase >= 3 ? { opacity: 1, scale: 1 } :
            phase >= 2 ? { opacity: 0.15, scale: 0.8 } :
            { opacity: 0, scale: 0.5 }
          }
          transition={{ duration: 0.5, ease: EASE }}
        >
          {phase >= 3 && (
            <motion.div
              className="ai-pipe__orb-ring ai-pipe__orb-ring--outer"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {phase >= 3 && (
            <motion.div
              className="ai-pipe__orb-ring ai-pipe__orb-ring--inner"
              animate={{ rotate: -360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <motion.div
            className="ai-pipe__orb-core"
            animate={phase >= 3 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Results */}
        <div className="ai-pipe__results">
          {results.map((s, i) => (
            <motion.div
              key={s.name}
              className="ai-pipe__result"
              initial={{ opacity: 0, y: 12 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ delay: i * 0.12, duration: 0.4, ease: EASE }}
            >
              <img className="ai-pipe__result-av" src={s.photo} alt={s.name} />
              <div className="ai-pipe__result-info">
                <span className="ai-pipe__result-name">{s.name}</span>
                <span className="ai-pipe__result-topic">{s.topic}</span>
              </div>
              <motion.span
                className="ai-pipe__result-score"
                initial={{ scale: 0 }}
                animate={phase >= 4 ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 300, damping: 15 }}
              >
                {s.score}%
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        className="ai-pipe__footer"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link to="/search" className="ai-pipe__cta">
          Try it yourself
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </motion.div>
    </div>
  )
}

export default EnhancedAIDemo;