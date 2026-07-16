import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1]

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

const REJECTION_COLORS = {
  pro_bono: '#d97706',
  exclusivity: '#dc2626',
  no_availability: '#7c3aed',
}

const REJECTION_LABELS = {
  pro_bono: 'Pro Bono',
  exclusivity: 'Exclusivity',
  no_availability: 'No Availability',
}

function formatCurrency(value, currency) {
  const symbol = CURRENCY_SYMBOLS[currency] || '$'
  if (value >= 1000000) return `${symbol}${Math.floor(value / 100000) / 10}M`
  if (value >= 1000) return `${symbol}${Math.floor(value / 1000)}K`
  return `${symbol}${value}`
}

function formatRevenue(byCurrency, dominantCurrency) {
  if (!byCurrency || byCurrency.length === 0) return '$0'
  const dominant = byCurrency.find(c => c.currency === dominantCurrency)
  const others = byCurrency.filter(c => c.currency !== dominantCurrency && c.total > 0)
  const parts = []
  if (dominant && dominant.total > 0) parts.push(formatCurrency(dominant.total, dominant.currency))
  for (const c of others) parts.push(formatCurrency(c.total, c.currency))
  return parts.length > 0 ? parts.join(' + ') : '$0'
}

/* ---- SVG Pie Helpers ---- */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function pieSectorPath(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 360) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
  }
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`
}

/* ---- Animated Number ---- */
function AnimatedNumber({ value, format, duration = 600 }) {
  const ref = useRef(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = prevValue.current
    const to = typeof value === 'number' ? value : parseFloat(value) || 0
    prevValue.current = to
    if (from === to) {
      el.textContent = format ? format(to) : to
      return
    }
    const start = performance.now()
    function tick(now) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      el.textContent = format ? format(current) : Math.round(current)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, format, duration])

  return <span ref={ref}>{format ? format(typeof value === 'number' ? value : 0) : value}</span>
}

const MODAL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'rejections', label: 'Declines' },
]

export default function EnquiryAnalyticsModal({ open, onClose, engagementType = 'all', onFilterByReason }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [hoveredReason, setHoveredReason] = useState(null)
  const fetchedRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const key = engagementType || 'all'
    if (fetchedRef.current === key && analytics) return
    setLoading(true)
    const params = new URLSearchParams()
    if (engagementType && engagementType !== 'all') params.set('engagementType', engagementType)
    fetch(`/api/admin/enquiry-analytics?${params}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data.analytics)
          fetchedRef.current = key
        }
      })
      .catch(err => console.error('Failed to fetch enquiry analytics:', err))
      .finally(() => setLoading(false))
  }, [open, engagementType])

  useEffect(() => {
    fetchedRef.current = null
  }, [engagementType])

  // Reset tab when modal opens
  useEffect(() => {
    if (open) setActiveTab('overview')
  }, [open])

  // Build card definitions
  const allCards = analytics ? [
    { key: 'revenue', label: 'Revenue', value: formatRevenue(analytics.revenueByCurrency, analytics.dominantCurrency), numericValue: analytics.revenueByCurrency?.find(c => c.currency === analytics.dominantCurrency)?.total || 0, modifier: 'revenue', tab: 'paid' },
    { key: 'rejected', label: 'Declined Value', value: formatRevenue(analytics.rejectedByCurrency, analytics.dominantCurrency), numericValue: analytics.rejectedByCurrency?.find(c => c.currency === analytics.dominantCurrency)?.total || 0, modifier: 'rejected', tab: 'paid' },
    { key: 'acceptance', label: 'Acceptance Rate', numericValue: analytics.acceptanceRate || 0, suffix: '%', modifier: '', tab: 'both' },
    { key: 'avgbudget', label: 'Avg Budget', numericValue: analytics.averageBudget || 0, modifier: '', tab: 'paid' },
    { key: 'probono', label: 'Pro Bono', numericValue: analytics.proBonoCount || 0, modifier: 'probono', tab: 'probono' },
    { key: 'flexible', label: 'Flexible', numericValue: analytics.proBonoFlexibleCount || 0, modifier: '', tab: 'probono' },
  ] : []

  const cards = engagementType === 'all'
    ? allCards
    : engagementType === 'Paid'
      ? allCards.filter(c => c.tab === 'paid' || c.tab === 'both')
      : allCards.filter(c => c.tab === 'probono' || c.tab === 'both')

  const rejectionReasons = analytics?.rejectionReasons || []
  const rejTotal = rejectionReasons.reduce((sum, r) => sum + r.count, 0)

  function formatMetricValue(card) {
    if (card.value) return card.value
    if (card.suffix) return (v) => `${Math.round(v)}${card.suffix}`
    if (card.key === 'avgbudget') return (v) => v > 0 ? formatCurrency(Math.round(v), analytics?.dominantCurrency) : '-'
    return (v) => `${Math.round(v)}`
  }

  // Build pie segments
  const pieSegments = []
  if (rejTotal > 0) {
    let cumulative = 0
    for (const r of rejectionReasons) {
      const angle = (r.count / rejTotal) * 360
      pieSegments.push({
        reason: r.reason,
        count: r.count,
        pct: Math.round((r.count / rejTotal) * 100),
        startAngle: cumulative,
        endAngle: cumulative + angle,
        color: REJECTION_COLORS[r.reason] || '#94a3b8',
      })
      cumulative += angle
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="enq-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="enq-modal__container"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with close */}
            <div className="enq-modal__header">
              <h3 className="enq-modal__title">Enquiry Analytics</h3>
              <button className="enq-modal__close" onClick={onClose}>&times;</button>
            </div>

            {/* Inner tabs */}
            <div className="enq-modal__tabs">
              {MODAL_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`enq-modal__tab ${activeTab === tab.key ? 'enq-modal__tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {tab.key === 'rejections' && rejTotal > 0 && (
                    <span className="enq-modal__tab-count">{rejTotal}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="enq-modal__body">
              {loading && !analytics ? (
                <div className="admin-loading">
                  <div className="admin-loading__spinner" />
                  Loading analytics...
                </div>
              ) : analytics ? (
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      {/* Overview: metric cards */}
                      <div className="enq-modal__metrics">
                        {cards.map(card => {
                          const fmt = formatMetricValue(card)
                          return (
                            <div
                              key={card.key}
                              className={`enq-modal__metric ${card.modifier ? `enq-modal__metric--${card.modifier}` : ''}`}
                            >
                              <div className="enq-modal__metric-value">
                                {typeof fmt === 'function' ? (
                                  <AnimatedNumber value={card.numericValue} format={fmt} />
                                ) : (
                                  fmt
                                )}
                              </div>
                              <div className="enq-modal__metric-label">{card.label}</div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Quick summary row */}
                      <div className="enq-modal__summary">
                        <div className="enq-modal__summary-item">
                          <span className="enq-modal__summary-value">{analytics.paidCount || 0}</span>
                          <span className="enq-modal__summary-label">Paid Enquiries</span>
                        </div>
                        <div className="enq-modal__summary-divider" />
                        <div className="enq-modal__summary-item">
                          <span className="enq-modal__summary-value">{analytics.proBonoCount || 0}</span>
                          <span className="enq-modal__summary-label">Pro Bono</span>
                        </div>
                        <div className="enq-modal__summary-divider" />
                        <div className="enq-modal__summary-item">
                          <span className="enq-modal__summary-value">{rejTotal}</span>
                          <span className="enq-modal__summary-label">Declined</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rejections"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      {rejTotal > 0 ? (
                        <>
                          {/* Pie chart + legend side by side */}
                          <div className="enq-modal__pie-section">
                            <div className="enq-modal__pie-wrap">
                              <svg className="enq-modal__pie-svg" viewBox="0 0 200 200">
                                {pieSegments.map((seg, i) => (
                                  <motion.path
                                    key={seg.reason}
                                    d={pieSectorPath(100, 100, 90, seg.startAngle, seg.endAngle)}
                                    fill={seg.color}
                                    className="enq-modal__pie-segment"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                      opacity: hoveredReason && hoveredReason !== seg.reason ? 0.3 : 1,
                                      scale: hoveredReason === seg.reason ? 1.04 : 1,
                                    }}
                                    transition={{ duration: 0.3, delay: i * 0.08, ease: EASE }}
                                    style={{ transformOrigin: '100px 100px', cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredReason(seg.reason)}
                                    onMouseLeave={() => setHoveredReason(null)}
                                    onClick={() => onFilterByReason?.(seg.reason)}
                                  />
                                ))}
                                {/* Donut hole */}
                                <circle cx="100" cy="100" r="52" fill="#fff" />
                              </svg>
                              <div className="enq-modal__pie-center">
                                <div className="enq-modal__pie-total">{rejTotal}</div>
                                <div className="enq-modal__pie-total-label">Declined</div>
                              </div>
                            </div>

                            <div className="enq-modal__legend">
                              {pieSegments.map(seg => (
                                <div
                                  key={seg.reason}
                                  className={`enq-modal__legend-item ${hoveredReason === seg.reason ? 'enq-modal__legend-item--active' : ''}`}
                                  onMouseEnter={() => setHoveredReason(seg.reason)}
                                  onMouseLeave={() => setHoveredReason(null)}
                                  onClick={() => onFilterByReason?.(seg.reason)}
                                >
                                  <span className="enq-modal__legend-dot" style={{ background: seg.color }} />
                                  <span className="enq-modal__legend-label">{REJECTION_LABELS[seg.reason] || seg.reason}</span>
                                  <span className="enq-modal__legend-count">{seg.count}</span>
                                  <span className="enq-modal__legend-pct">{seg.pct}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Animated horizontal bars */}
                          <div className="enq-modal__bars">
                            <div className="enq-modal__bars-title">Breakdown</div>
                            {pieSegments.map((seg, i) => (
                              <div
                                key={seg.reason}
                                className={`enq-modal__bar-row ${hoveredReason === seg.reason ? 'enq-modal__bar-row--active' : ''}`}
                                onMouseEnter={() => setHoveredReason(seg.reason)}
                                onMouseLeave={() => setHoveredReason(null)}
                                onClick={() => onFilterByReason?.(seg.reason)}
                              >
                                <div className="enq-modal__bar-label">{REJECTION_LABELS[seg.reason] || seg.reason}</div>
                                <div className="enq-modal__bar-track">
                                  <motion.div
                                    className="enq-modal__bar-fill"
                                    style={{ background: seg.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${seg.pct}%` }}
                                    transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: EASE }}
                                  />
                                </div>
                                <div className="enq-modal__bar-value">{seg.count}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="enq-modal__empty">
                          <div className="enq-modal__empty-icon">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                              <circle cx="20" cy="20" r="18" stroke="#e5e5e2" strokeWidth="2" strokeDasharray="4 3" />
                              <path d="M14 20h12M20 14v12" stroke="#d4d4d4" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="enq-modal__empty-text">No declined enquiries yet</div>
                          <div className="enq-modal__empty-sub">Decline analytics will appear here once enquiries are declined</div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
