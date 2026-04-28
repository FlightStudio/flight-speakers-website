import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

const CATEGORY_OPTIONS = ['Rankings', 'Guide', 'Inspiration', 'Trends']

function BlockEditor({ blocks, onChange }) {
  const handleBlockChange = (i, field, value) => {
    const updated = blocks.map((b, idx) => idx === i ? { ...b, [field]: value } : b)
    onChange(updated)
  }

  const addBlock = (i) => {
    const updated = [...blocks]
    updated.splice(i + 1, 0, { type: 'p', text: '' })
    onChange(updated)
  }

  const removeBlock = (i) => {
    if (blocks.length <= 1) return
    onChange(blocks.filter((_, idx) => idx !== i))
  }

  const moveBlock = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const updated = [...blocks]
    ;[updated[i], updated[j]] = [updated[j], updated[i]]
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {blocks.map((block, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <select
            value={block.type}
            onChange={e => handleBlockChange(i, 'type', e.target.value)}
            style={{ width: 60, padding: '6px 4px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', fontSize: 12 }}
          >
            <option value="p">p</option>
            <option value="h2">h2</option>
          </select>
          <textarea
            value={block.text}
            onChange={e => handleBlockChange(i, 'text', e.target.value)}
            rows={block.type === 'h2' ? 1 : 3}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: block.type === 'h2' ? 'rgba(99,102,241,0.06)' : 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)', fontSize: 13, resize: 'vertical',
              fontWeight: block.type === 'h2' ? 600 : 400,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} style={iconBtnStyle}>
              ↑
            </button>
            <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} style={iconBtnStyle}>
              ↓
            </button>
            <button type="button" onClick={() => addBlock(i)} style={{ ...iconBtnStyle, color: '#22c55e' }}>
              +
            </button>
            <button type="button" onClick={() => removeBlock(i)} disabled={blocks.length <= 1} style={{ ...iconBtnStyle, color: '#ef4444' }}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const iconBtnStyle = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 4, width: 26, height: 26,
  cursor: 'pointer', fontSize: 13,
  color: 'var(--color-text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
}

export default function AdminArticleEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)
  const [statusMsg, setStatusMsg] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectPrompt, setShowRejectPrompt] = useState(false)

  // Editable fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Rankings')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState([])
  const [image, setImage] = useState('')
  const [tileC1, setTileC1] = useState('#0F172A')
  const [tileC2, setTileC2] = useState('#1E3A5F')
  const [readTime, setReadTime] = useState(8)
  const [adminNotes, setAdminNotes] = useState('')

  const loadArticle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/articles/${id}`)
      const data = await res.json()
      if (data.success) {
        const a = data.article
        setArticle(a)
        setTitle(a.title || '')
        setSlug(a.slug || '')
        setCategory(a.category || 'Rankings')
        setExcerpt(a.excerpt || '')
        setBody(a.body || [])
        setImage(a.image || '')
        setTileC1(a.tile?.c1 || '#0F172A')
        setTileC2(a.tile?.c2 || '#1E3A5F')
        setReadTime(a.readTime || 8)
        setAdminNotes(a.adminNotes || '')
      } else {
        setError('Failed to load article')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadArticle()
  }, [loadArticle])

  const handleSave = async () => {
    setSaving(true)
    setStatusMsg(null)
    try {
      const payload = {
        title, slug, category, excerpt, body,
        image: image || null,
        tileC1, tileC2,
        readTime: parseInt(readTime, 10) || 8,
        adminNotes: adminNotes || null,
      }
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setArticle(data.article)
        setStatusMsg('Saved')
      } else {
        setStatusMsg(`Error: ${data.message || 'Save failed'}`)
      }
    } catch {
      setStatusMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!window.confirm('Publish this article to the public site?')) return
    setPublishing(true)
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/admin/articles/${id}/publish`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setArticle(data.article)
        setStatusMsg('Published')
      } else {
        setStatusMsg(`Error: ${data.message}`)
      }
    } catch {
      setStatusMsg('Network error')
    } finally {
      setPublishing(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/admin/articles/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rejectNotes || null }),
      })
      const data = await res.json()
      if (data.success) {
        setArticle(data.article)
        setAdminNotes(data.article.adminNotes || '')
        setStatusMsg('Rejected')
        setShowRejectPrompt(false)
      } else {
        setStatusMsg(`Error: ${data.message}`)
      }
    } catch {
      setStatusMsg('Network error')
    } finally {
      setRejecting(false)
    }
  }

  const handleImageFile = async (file) => {
    if (!file) return
    setUploadingImage(true)
    setStatusMsg(null)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch(`/api/admin/articles/${id}/image`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setImage(data.image)
        setStatusMsg('Image uploaded')
      } else {
        setStatusMsg(`Image error: ${data.message}`)
      }
    } catch {
      setStatusMsg('Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageFile(file)
  }

  if (loading) {
    return (
      <div className="admin-page" style={{ padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>
    )
  }

  if (error || !article) {
    return (
      <div className="admin-page" style={{ padding: '3rem', color: '#ef4444' }}>
        {error || 'Article not found'}
      </div>
    )
  }

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ paddingBottom: 120 }}
    >
      <div className="admin-page__header">
        <div>
          <button onClick={() => navigate('/admin/articles')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4, padding: 0 }}>
            ← All articles
          </button>
          <h1 className="admin-page__title" style={{ marginTop: 4 }}>Edit Article</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: article.status === 'published' ? 'rgba(34,197,94,0.1)' : article.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
            color: article.status === 'published' ? '#22c55e' : article.status === 'rejected' ? '#ef4444' : '#f59e0b',
            textTransform: 'capitalize',
          }}>
            {article.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>

        {/* Title */}
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Slug */}
        <Field label="Slug (URL)">
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>/news/{slug}</div>
        </Field>

        {/* Category + Read time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Category">
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Read time (minutes)">
            <input
              type="number"
              min={1} max={60}
              value={readTime}
              onChange={e => setReadTime(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Excerpt */}
        <Field label="Excerpt (25-40 words)">
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        {/* Image */}
        <Field label="Cover Image">
          {image && (
            <div style={{ marginBottom: 10 }}>
              <img src={image} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
            </div>
          )}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--color-border)', borderRadius: 8,
              padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: 13,
              background: 'var(--color-bg-elevated)',
            }}
          >
            {uploadingImage ? 'Uploading...' : 'Click or drag an image to replace'}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleImageFile(e.target.files?.[0])}
          />
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>Or paste image URL</label>
            <input
              type="text"
              value={image}
              onChange={e => setImage(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>
        </Field>

        {/* Tile gradient */}
        <Field label="Tile Gradient (fallback when no image)">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>
              <label style={labelStyle}>Colour 1 (from)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={tileC1} onChange={e => setTileC1(e.target.value)} style={{ width: 36, height: 32, border: 'none', padding: 0, cursor: 'pointer' }} />
                <input type="text" value={tileC1} onChange={e => setTileC1(e.target.value)} style={{ ...inputStyle, width: 96 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Colour 2 (to)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={tileC2} onChange={e => setTileC2(e.target.value)} style={{ width: 36, height: 32, border: 'none', padding: 0, cursor: 'pointer' }} />
                <input type="text" value={tileC2} onChange={e => setTileC2(e.target.value)} style={{ ...inputStyle, width: 96 }} />
              </div>
            </div>
            <div style={{ flex: 1, height: 48, borderRadius: 8, background: `linear-gradient(135deg, ${tileC1}, ${tileC2})` }} />
          </div>
        </Field>

        {/* Body blocks */}
        <Field label="Body Blocks">
          <BlockEditor blocks={body} onChange={setBody} />
        </Field>

        {/* Admin notes */}
        <Field label="Admin Notes (internal only)">
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

      </div>

      {/* Sticky action bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 240, right: 0,
        background: 'var(--color-bg-elevated)',
        borderTop: '1px solid var(--color-border)',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', gap: 12, zIndex: 30,
      }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {article.status !== 'published' && (
          <button onClick={handlePublish} disabled={publishing} className="btn" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        )}
        {article.status !== 'rejected' && (
          <button onClick={() => setShowRejectPrompt(true)} disabled={rejecting} className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            Reject
          </button>
        )}
        <button onClick={() => navigate('/admin/articles')} className="btn btn-secondary">Cancel</button>
        {statusMsg && (
          <span style={{ fontSize: 12, color: statusMsg.startsWith('Error') ? '#ef4444' : 'var(--color-text-muted)', marginLeft: 8 }}>
            {statusMsg}
          </span>
        )}
      </div>

      {/* Reject prompt overlay */}
      {showRejectPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 12, padding: '2rem', width: 460, maxWidth: '92vw', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Reject article</h3>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                rows={4}
                placeholder="Reason for rejection..."
                style={{ ...inputStyle, resize: 'vertical', width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectPrompt(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleReject} disabled={rejecting} className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const labelStyle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--color-text-muted)',
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)', fontSize: 14,
}
