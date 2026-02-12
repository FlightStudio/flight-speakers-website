import { motion } from 'framer-motion'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]

export default function DashboardChart({ data = [], days = 14, onChangeDays }) {
  if (data.length === 0) return null

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const max = Math.max(...data.map(d => d.count), 1)
  const avg = (total / data.length).toFixed(1)
  const peak = Math.max(...data.map(d => d.count))

  return (
    <div className="dash-chart">
      <div className="dash-chart__header">
        <div className="dash-chart__header-left">
          <h3 className="dash-chart__title">Enquiry Activity</h3>
          <div className="dash-chart__summary">
            <span className="dash-chart__summary-stat">
              <strong>{total}</strong> total
            </span>
            <span className="dash-chart__summary-stat">
              <strong>{avg}</strong> avg/day
            </span>
            <span className="dash-chart__summary-stat">
              <strong>{peak}</strong> peak
            </span>
          </div>
        </div>
        <div className="dash-chart__range-pills">
          {RANGES.map(r => (
            <button
              key={r.days}
              className={`dash-chart__range-pill ${days === r.days ? 'dash-chart__range-pill--active' : ''}`}
              onClick={() => onChangeDays?.(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-chart__bars" key={days}>
        {data.map((d, i) => {
          const date = new Date(d.date + 'T00:00:00')
          const dayLabel = DAYS_SHORT[date.getDay()]
          const dayNum = date.getDate()
          const monthLabel = MONTHS_SHORT[date.getMonth()]
          const pct = (d.count / max) * 100
          const showLabel = days <= 14 || i % Math.ceil(data.length / 15) === 0 || i === data.length - 1

          return (
            <div key={i} className="dash-chart__col" title={`${dayLabel} ${dayNum} ${monthLabel}: ${d.count} enquiries`}>
              <div className="dash-chart__bar-wrap">
                <motion.div
                  className={`dash-chart__bar ${d.count === 0 ? 'dash-chart__bar--empty' : ''}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 3)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                />
                {d.count > 0 && days <= 14 && (
                  <motion.span
                    className="dash-chart__bar-value"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.02 }}
                  >
                    {d.count}
                  </motion.span>
                )}
              </div>
              {showLabel && (
                <div className="dash-chart__label">
                  <span className="dash-chart__day">{days <= 14 ? dayLabel : `${dayNum}`}</span>
                  <span className="dash-chart__date">{days <= 14 ? dayNum : monthLabel}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
