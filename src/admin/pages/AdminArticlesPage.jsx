import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../../constants/animation'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'draft',     label: 'Drafts' },
  { key: 'published', label: 'Published' },
  { key: 'rejected',  label: 'Rejected' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
  const [showGuide, setShowGuide] = useState(false)

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

  useEffect(() => { fetchArticles(activeTab) }, [activeTab, fetchArticles])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateMsg(null)
    try {
      const res = await fetch('/api/admin/articles/generate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setGenerateMsg({ kind: 'ok', text: `Draft created: "${data.article.title}"` })
        fetchArticles(activeTab)
      } else {
        setGenerateMsg({ kind: 'err', text: data.message || 'Generation failed' })
      }
    } catch {
      setGenerateMsg({ kind: 'err', text: 'Network error' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div
      className="admin-page articles-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="articles-page__header">
        <div>
          <h1 className="admin-page__title">Articles</h1>
          <p className="admin-page__subtitle">
            AI-generated speaker roundups for the public News section. Auto-generates Mon &amp; Thu at 09:00 UTC.
          </p>
        </div>
        <div className="articles-page__header-actions">
          <button
            type="button"
            className="articles-page__guide-btn"
            onClick={() => setShowGuide(s => !s)}
            aria-expanded={showGuide}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 4.5v.01M8 7v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Editorial standards
          </button>
          <button
            type="button"
            className="articles-page__generate-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating…' : 'Generate Now'}
          </button>
        </div>
      </div>

      {generateMsg && (
        <div className={`articles-page__msg articles-page__msg--${generateMsg.kind}`}>
          {generateMsg.text}
        </div>
      )}

      <AnimatePresence initial={false}>
        {showGuide && (
          <motion.div
            key="guide"
            className="articles-page__guide"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="articles-page__guide-inner">
              <div className="articles-page__guide-section">
                <h3>Writing template</h3>
                <ol>
                  <li><strong>Title</strong> — 10-12 words, includes year + region/audience + intent verb (<em>e.g. "to hire"</em>).</li>
                  <li><strong>Opening paragraph</strong> — 50-80 words. Establish authority + market context. No clichés.</li>
                  <li><strong>Question H2</strong> — phrased as a question for featured-snippet capture.</li>
                  <li><strong>Numbered speaker H2s</strong> — credentials line + 100-150 word profile + implicit value statement.</li>
                  <li><strong>Soft CTA H2</strong> at close. Direct, not urgent. No exclamation marks.</li>
                </ol>
              </div>

              <div className="articles-page__guide-grid">
                <div className="articles-page__guide-section">
                  <h3>Do</h3>
                  <ul>
                    <li>Active voice, third-person editorial tone</li>
                    <li>Concrete authority signals (BBC, Stanford, FTSE 100)</li>
                    <li>Numerical credibility ("700+ hours of interviews")</li>
                    <li>UK English on UK pieces, US English on US pieces</li>
                    <li>Internal links to <code>/enquiry</code>, <code>/speakers</code></li>
                  </ul>
                </div>
                <div className="articles-page__guide-section">
                  <h3>Avoid</h3>
                  <ul>
                    <li>Pricing, fees, costs, budget figures</li>
                    <li>Superlatives — "amazing", "incredible"</li>
                    <li>Marketing speak — "thought leader", "deep dive"</li>
                    <li>Em dashes — use hyphens or commas</li>
                    <li>Calls to urgency — "limited spots"</li>
                  </ul>
                </div>
              </div>

              <div className="articles-page__guide-section">
                <h3>Pre-publish checklist</h3>
                <ul className="articles-page__guide-checklist">
                  <li>Title 10-12 words, year + region present</li>
                  <li>Opening paragraph 50-80 words, no clichés</li>
                  <li>First H2 in question form</li>
                  <li>Speaker entries numbered 1, 2, 3 …</li>
                  <li>No pricing, fees or budget figures</li>
                  <li>Internal links appear at least twice</li>
                  <li>Reading time 5-9 mins (~1,000-1,800 words)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="articles-page__tabs" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab.key
          const count = tab.key === 'all' ? total : counts[tab.key]
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`articles-page__tab${isActive ? ' articles-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              {count != null && <span className="articles-page__tab-count">{count}</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="articles-page__empty">Loading…</div>
      ) : error ? (
        <div className="articles-page__empty articles-page__empty--err">{error}</div>
      ) : articles.length === 0 ? (
        <div className="articles-page__empty">
          {activeTab === 'draft' ? 'No draft articles. Click "Generate Now" to create one.' : 'No articles in this view.'}
        </div>
      ) : (
        <ul className="articles-list">
          {articles.map(article => (
            <li
              key={article.id}
              className="articles-row"
              onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
              tabIndex={0}
              role="button"
              onKeyDown={e => { if (e.key === 'Enter') navigate(`/admin/articles/${article.id}/edit`) }}
            >
              <div className="articles-row__main">
                <div className="articles-row__title">{article.title}</div>
                <div className="articles-row__meta">
                  <span className="articles-row__category">{article.category}</span>
                  <span className="articles-row__sep" aria-hidden="true">·</span>
                  <span className="articles-row__slug">/news/{article.slug}</span>
                </div>
              </div>
              <div className="articles-row__dates">
                <div>
                  <span className="articles-row__dlabel">Generated</span>
                  <span className="articles-row__dvalue">{formatDate(article.generatedAt)}</span>
                </div>
                <div>
                  <span className="articles-row__dlabel">Published</span>
                  <span className="articles-row__dvalue">{formatDate(article.publishedAt)}</span>
                </div>
              </div>
              <div className={`articles-row__status articles-row__status--${article.status}`}>
                {article.status}
              </div>
              <svg className="articles-row__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
