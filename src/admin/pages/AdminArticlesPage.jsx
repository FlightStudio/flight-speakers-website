import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../../constants/animation'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
]

const STATUS_COLORS = {
  draft: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  published: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
}

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || {}
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 100,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
      background: style.bg, color: style.color, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

export default function AdminArticlesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [articles, setArticles] = useState([])
  const [counts, setCounts] = useState({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState(null)

  const fetchArticles = useCallback(async (status) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' })
      if (status && status !== 'all') params.set('status', status)
      const res = await fetch(`/api/admin/articles?${params}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.articles)
        setTotal(data.total)
        setCounts(data.counts || {})
      } else {
        setError('Failed to load articles')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles(activeTab)
  }, [activeTab, fetchArticles])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateMsg(null)
    try {
      const res = await fetch('/api/admin/articles/generate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setGenerateMsg(`Draft created: "${data.article.title}"`)
        fetchArticles(activeTab)
      } else {
        setGenerateMsg(`Error: ${data.message}`)
      }
    } catch {
      setGenerateMsg('Network error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Articles</h1>
          <p className="admin-page__subtitle">AI-generated and seed articles for the News section</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary"
            style={{ minWidth: 140 }}
          >
            {generating ? 'Generating...' : 'Generate Now'}
          </button>
          {generateMsg && (
            <span style={{ fontSize: 12, color: generateMsg.startsWith('Error') ? '#ef4444' : '#22c55e' }}>
              {generateMsg}
            </span>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="enq-type-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`enq-type-tabs__tab ${activeTab === tab.key ? 'enq-type-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && counts[tab.key] > 0 && (
              <span className="admin-sidebar__badge" style={{ marginLeft: 6 }}>{counts[tab.key]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
      ) : articles.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No articles yet.</div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Generated</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/articles/${article.id}/edit`)}>
                  <td style={{ fontWeight: 500, maxWidth: 360 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {article.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      /news/{article.slug}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{article.category}</td>
                  <td><StatusBadge status={article.status} /></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {article.generatedAt
                      ? new Date(article.generatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      onClick={e => { e.stopPropagation(); navigate(`/admin/articles/${article.id}/edit`) }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '0.75rem 1rem', fontSize: 12, color: 'var(--color-text-muted)' }}>
            {total} total {total === 1 ? 'article' : 'articles'}
          </div>
        </div>
      )}
    </motion.div>
  )
}
