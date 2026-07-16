import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ENQUIRY_STATUSES, STATUS_LABELS } from '../constants/statuses'

// Kanban-style pipeline view. 'new' enquiries are not shown — they enter the
// funnel once reviewed (which is also what pushes them to the Monday Deals
// board). Dragging a card to another column PATCHes the status, so the
// Monday stage sync fires exactly like a status-badge change.
const FUNNEL_STATUSES = ENQUIRY_STATUSES.filter(s => s !== 'new')

const PAGE_SIZE = 15

// Matches the status-badge palette in admin.css: dot color, light background
// tint, and dark label text per status.
const STATUS_COLORS = {
  reviewed: { dot: '#C9A227', tint: '#fdf8ec', text: '#92700c' },
  calendar_meeting: { dot: '#8b5cf6', tint: '#f5f3ff', text: '#5b21b6' },
  negotiation: { dot: '#f97316', tint: '#fff7ed', text: '#9a3412' },
  confirmed: { dot: '#22c55e', tint: '#ecfdf5', text: '#166534' },
  contract_sent: { dot: '#3b82f6', tint: '#eff6ff', text: '#1e40af' },
  closed_won: { dot: '#14b8a6', tint: '#f0fdfa', text: '#115e59' },
  closed_lost: { dot: '#f43f5e', tint: '#fff1f2', text: '#9f1239' },
  completed_event: { dot: '#059669', tint: '#d1fae5', text: '#065f46' },
  declined: { dot: '#94a3b8', tint: '#f1f5f9', text: '#475569' },
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

function shortBudget(budget, currency) {
  if (!budget) return null
  if (/^\d+$/.test(budget)) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$'
    return `${symbol}${parseInt(budget, 10).toLocaleString()}`
  }
  return budget
}

function FunnelColumn({ status, column, isDragOver, onDragOverColumn, onDrop, onLoadMore, children }) {
  const bodyRef = useRef(null)

  // "Fill the column": if the loaded cards don't overflow the column yet and
  // there are more pages, keep loading until the column is scrollable.
  useEffect(() => {
    const body = bodyRef.current
    if (!body || !column || column.loading || !column.hasMore) return
    if (body.scrollHeight <= body.clientHeight) onLoadMore(status)
  }, [status, column, onLoadMore])

  const handleScroll = (e) => {
    const el = e.target
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      onLoadMore(status)
    }
  }

  const colors = STATUS_COLORS[status] || {}

  return (
    <div
      className={`funnel-col ${isDragOver ? 'funnel-col--over' : ''}`}
      style={{
        '--funnel-dot': colors.dot,
        '--funnel-tint': colors.tint,
        '--funnel-text': colors.text,
      }}
      onDragOver={e => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOverColumn(status)
      }}
      onDrop={e => {
        e.preventDefault()
        onDrop(status)
      }}
    >
      <div className="funnel-col__header">
        <span className="funnel-col__dot" style={{ background: colors.dot }} />
        <span className="funnel-col__title">{STATUS_LABELS[status] || status}</span>
        <span className="funnel-col__count">{column?.total ?? 0}</span>
      </div>
      <div className="funnel-col__body" ref={bodyRef} onScroll={handleScroll}>
        {children}
        {column?.loading && <div className="funnel-col__loading">Loading…</div>}
        {!column?.loading && column?.items?.length === 0 && (
          <div className="funnel-col__empty">Drop here</div>
        )}
      </div>
    </div>
  )
}

export default function EnquiryFunnel({ engagementType = 'all' }) {
  const navigate = useNavigate()
  const [columns, setColumns] = useState({})
  const [dragOverCol, setDragOverCol] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const dragPayload = useRef(null)

  const fetchColumn = useCallback(async (status, page = 1, append = false) => {
    setColumns(prev => ({
      ...prev,
      [status]: { items: [], total: 0, hasMore: false, page: 0, ...prev[status], loading: true },
    }))
    try {
      const params = new URLSearchParams({ status, page, limit: PAGE_SIZE, sort: 'newest' })
      if (engagementType && engagementType !== 'all') params.set('engagementType', engagementType)
      const res = await fetch(`/api/admin/enquiries?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Fetch failed')
      setColumns(prev => {
        const existing = append ? (prev[status]?.items || []) : []
        // Optimistically-moved cards can reappear in a fetched page — dedupe
        const seen = new Set(existing.map(e => e.id))
        const items = [...existing, ...data.enquiries.filter(e => !seen.has(e.id))]
        return {
          ...prev,
          [status]: { items, total: data.total, page, hasMore: page * PAGE_SIZE < data.total, loading: false },
        }
      })
    } catch (err) {
      console.error(`Failed to fetch ${status} column:`, err)
      setColumns(prev => ({ ...prev, [status]: { ...prev[status], loading: false } }))
    }
  }, [engagementType])

  useEffect(() => {
    FUNNEL_STATUSES.forEach(status => fetchColumn(status, 1, false))
  }, [fetchColumn])

  const loadMore = useCallback((status) => {
    setColumns(prev => {
      const col = prev[status]
      if (col && !col.loading && col.hasMore) {
        // fire outside the updater to avoid double-fetch in StrictMode
        queueMicrotask(() => fetchColumn(status, col.page + 1, true))
        return { ...prev, [status]: { ...col, loading: true } }
      }
      return prev
    })
  }, [fetchColumn])

  const handleDrop = async (toStatus) => {
    setDragOverCol(null)
    // The optimistic move unmounts the dragged node, so its dragend never
    // fires — clear the dragging state here or the card keeps its low opacity
    setDraggingId(null)
    const payload = dragPayload.current
    dragPayload.current = null
    if (!payload || payload.from === toStatus) return
    const { enquiry, from } = payload

    // Optimistic move
    setColumns(prev => {
      const fromCol = prev[from]
      const toCol = prev[toStatus]
      if (!fromCol || !toCol) return prev
      return {
        ...prev,
        [from]: {
          ...fromCol,
          items: fromCol.items.filter(e => e.id !== enquiry.id),
          total: Math.max(fromCol.total - 1, 0),
        },
        [toStatus]: {
          ...toCol,
          items: [{ ...enquiry, status: toStatus }, ...toCol.items],
          total: toCol.total + 1,
        },
      }
    })

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: toStatus }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Update failed')
    } catch (err) {
      console.error('Failed to update status, reverting:', err)
      fetchColumn(from, 1, false)
      fetchColumn(toStatus, 1, false)
    }
  }

  return (
    <div className="funnel">
      {FUNNEL_STATUSES.map(status => (
        <FunnelColumn
          key={status}
          status={status}
          column={columns[status]}
          isDragOver={dragOverCol === status}
          onDragOverColumn={setDragOverCol}
          onDrop={handleDrop}
          onLoadMore={loadMore}
        >
          {(columns[status]?.items || []).map(enquiry => (
            <div
              key={enquiry.id}
              className={`funnel-card ${draggingId === enquiry.id ? 'funnel-card--dragging' : ''}`}
              draggable
              onDragStart={e => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', enquiry.id)
                dragPayload.current = { enquiry, from: status }
                setDraggingId(enquiry.id)
              }}
              onDragEnd={() => {
                setDraggingId(null)
                setDragOverCol(null)
              }}
              onClick={() => navigate(`/admin/enquiries/${enquiry.id}`)}
            >
              <div className="funnel-card__title">{enquiry.name}</div>
              {enquiry.organization && (
                <div className="funnel-card__org">{enquiry.organization}</div>
              )}
              {enquiry.event_name && (
                <div className="funnel-card__event">{enquiry.event_name}</div>
              )}
              <div className="funnel-card__meta">
                {enquiry.speaker_name && <span>{enquiry.speaker_name}</span>}
                {enquiry.budget_range && <span>{shortBudget(enquiry.budget_range, enquiry.currency)}</span>}
                <span>{timeAgo(enquiry.created_at)}</span>
              </div>
            </div>
          ))}
        </FunnelColumn>
      ))}
    </div>
  )
}
