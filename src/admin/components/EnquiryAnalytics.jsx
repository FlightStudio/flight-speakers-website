import { useState, useEffect } from 'react'

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

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

export default function EnquiryAnalytics({ engagementType = 'all' }) {
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const params = new URLSearchParams()
        if (engagementType && engagementType !== 'all') params.set('engagementType', engagementType)
        const res = await fetch(`/api/admin/enquiry-analytics?${params}`, { credentials: 'include' })
        const data = await res.json()
        if (data.success) setAnalytics(data.analytics)
      } catch (err) {
        console.error('Failed to fetch enquiry analytics:', err)
      }
    }
    fetchAnalytics()
  }, [engagementType])

  if (!analytics) return null

  const allCards = [
    {
      key: 'revenue',
      label: 'Revenue',
      value: formatRevenue(analytics.revenueByCurrency, analytics.dominantCurrency),
      modifier: 'revenue',
      tab: 'paid',
    },
    {
      key: 'rejected',
      label: 'Rejected Value',
      value: formatRevenue(analytics.rejectedByCurrency, analytics.dominantCurrency),
      modifier: 'rejected',
      tab: 'paid',
    },
    {
      key: 'acceptance',
      label: 'Acceptance Rate',
      value: `${analytics.acceptanceRate}%`,
      modifier: '',
      tab: 'both',
    },
    {
      key: 'avgbudget',
      label: 'Avg Budget',
      value: analytics.averageBudget > 0
        ? formatCurrency(analytics.averageBudget, analytics.dominantCurrency)
        : '—',
      modifier: '',
      tab: 'paid',
    },
    {
      key: 'probono',
      label: 'Pro Bono',
      value: analytics.proBonoCount,
      modifier: 'probono',
      tab: 'probono',
    },
    {
      key: 'flexible',
      label: 'Flexible',
      value: analytics.proBonoFlexibleCount,
      modifier: '',
      tab: 'probono',
    },
  ]

  const cards = engagementType === 'all'
    ? allCards
    : engagementType === 'Paid'
      ? allCards.filter(c => c.tab === 'paid' || c.tab === 'both')
      : allCards.filter(c => c.tab === 'probono' || c.tab === 'both')

  return (
    <div className="enq-analytics">
      {cards.map(card => (
        <div
          key={card.key}
          className={`enq-analytics__card ${card.modifier ? `enq-analytics__card--${card.modifier}` : ''}`}
        >
          <div className="enq-analytics__dot" />
          <div className="enq-analytics__text">
            <div className="enq-analytics__value">{card.value}</div>
            <div className="enq-analytics__label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
