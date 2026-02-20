export default function DashboardInsights({ responseMetrics, popularTopics = [], eventTypes = [] }) {
  if (!responseMetrics) return null

  const { responseRate, avgResponseHours, thisWeek, lastWeek } = responseMetrics
  const weekTrend = lastWeek > 0
    ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    : thisWeek > 0 ? 100 : 0

  return (
    <div className="dash-insights">
      <h3 className="dash-panel__title">Quick Insights</h3>

      <div className="dash-insights__metrics">
        <div className="dash-insights__metric">
          <div className="dash-insights__metric-value">{responseRate}%</div>
          <div className="dash-insights__metric-label">Response Rate</div>
        </div>
        <div className="dash-insights__metric">
          <div className="dash-insights__metric-value">
            {avgResponseHours != null ? `${avgResponseHours}h` : '-'}
          </div>
          <div className="dash-insights__metric-label">Avg Response</div>
        </div>
        <div className="dash-insights__metric">
          <div className="dash-insights__metric-value">
            {thisWeek}
            {weekTrend !== 0 && (
              <span className={`dash-insights__trend ${weekTrend > 0 ? 'dash-insights__trend--up' : 'dash-insights__trend--down'}`}>
                {weekTrend > 0 ? '+' : ''}{weekTrend}%
              </span>
            )}
          </div>
          <div className="dash-insights__metric-label">This Week</div>
        </div>
      </div>

      {popularTopics.length > 0 && (
        <div className="dash-insights__section">
          <div className="dash-insights__section-title">Popular Topics</div>
          <div className="dash-insights__tags">
            {popularTopics.map(t => (
              <span key={t.topic} className="dash-insights__tag">
                {t.topic}
                <span className="dash-insights__tag-count">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {eventTypes.length > 0 && (
        <div className="dash-insights__section">
          <div className="dash-insights__section-title">Event Types</div>
          <div className="dash-insights__bars">
            {eventTypes.map(e => {
              const max = eventTypes[0]?.count || 1
              return (
                <div key={e.type} className="dash-insights__bar-row">
                  <span className="dash-insights__bar-label">{e.type}</span>
                  <div className="dash-insights__bar-track">
                    <div
                      className="dash-insights__bar-fill"
                      style={{ width: `${(e.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="dash-insights__bar-num">{e.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
