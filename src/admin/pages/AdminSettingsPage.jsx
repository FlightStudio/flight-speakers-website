import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

export default function AdminSettingsPage() {
  const [monday, setMonday] = useState({ loading: true })
  const [klaviyo, setKlaviyo] = useState({ loading: true })
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState(null)
  const [testSending, setTestSending] = useState(false)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [editingKey, setEditingKey] = useState(null)
  const [editBody, setEditBody] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateFeedback, setTemplateFeedback] = useState(null)

  useEffect(() => {
    fetch('/api/admin/integrations/monday', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setMonday({ loading: false, ...data }))
      .catch(() => setMonday({ loading: false, connected: false, error: 'Failed to fetch' }))

    fetch('/api/admin/integrations/klaviyo', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setKlaviyo({ loading: false, ...data }))
      .catch(() => setKlaviyo({ loading: false, connected: false, error: 'Failed to fetch' }))

    fetch('/api/admin/templates', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) setTemplates(data.templates)
        setTemplatesLoading(false)
      })
      .catch(() => setTemplatesLoading(false))
  }, [])

  async function handleTestSend(e) {
    e.preventDefault()
    if (!testEmail || testSending) return

    setTestSending(true)
    setTestStatus(null)

    try {
      const res = await fetch('/api/admin/integrations/klaviyo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: testEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setTestStatus({ type: 'success', message: data.message })
      } else {
        setTestStatus({ type: 'error', message: data.message })
      }
    } catch {
      setTestStatus({ type: 'error', message: 'Network error' })
    } finally {
      setTestSending(false)
    }
  }

  function startEditing(tmpl) {
    setEditingKey(tmpl.reason_key)
    setEditSubject(tmpl.subject)
    setEditBody(tmpl.body)
    setTemplateFeedback(null)
  }

  function cancelEditing() {
    setEditingKey(null)
    setEditBody('')
    setEditSubject('')
    setTemplateFeedback(null)
  }

  async function saveTemplate(reasonKey) {
    setSavingTemplate(true)
    setTemplateFeedback(null)

    try {
      const res = await fetch(`/api/admin/templates/${reasonKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: editSubject, body: editBody }),
      })
      const data = await res.json()
      if (data.success) {
        setTemplates(prev => prev.map(t => t.reason_key === reasonKey ? data.template : t))
        setEditingKey(null)
        setTemplateFeedback({ type: 'success', message: 'Template saved' })
      } else {
        setTemplateFeedback({ type: 'error', message: data.message || 'Save failed' })
      }
    } catch {
      setTemplateFeedback({ type: 'error', message: 'Network error' })
    } finally {
      setSavingTemplate(false)
    }
  }

  const enquiryList = klaviyo.lists?.find(l => l.type === 'enquiry')
  const newsletterList = klaviyo.lists?.find(l => l.type === 'newsletter')

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <h1 className="admin-page__title">Settings</h1>
        <p className="admin-page__subtitle">Manage integrations, templates, and preferences</p>
      </div>

      {/* Integrations */}
      <div className="admin-settings-section">
        <h2 className="admin-settings-section__title">Integrations</h2>
      </div>

      <div className="admin-settings-grid">
        <div className="admin-settings-card">
          <div className="admin-settings-card__icon admin-settings-card__icon--monday">
            M
          </div>
          <div className="admin-settings-card__title">Monday.com</div>
          <div className="admin-settings-card__desc">
            Sync accepted enquiries to Monday.com boards for project management and team collaboration.
          </div>

          {monday.loading ? (
            <div className="admin-settings-card__status">
              <span className="admin-settings-card__status-dot admin-settings-card__status-dot--loading" />
              Checking...
            </div>
          ) : monday.connected ? (
            <>
              <div className="admin-settings-card__status admin-settings-card__status--connected">
                <span className="admin-settings-card__status-dot admin-settings-card__status-dot--connected" />
                Connected
              </div>
              <div className="admin-settings-card__lists">
                {monday.board && (
                  <div className="admin-settings-card__list-item">
                    <span className="admin-settings-card__list-label">Board</span>
                    <span className="admin-settings-card__list-value">{monday.board.name}</span>
                  </div>
                )}
                {monday.group && (
                  <div className="admin-settings-card__list-item">
                    <span className="admin-settings-card__list-label">Group</span>
                    <span className="admin-settings-card__list-value">{monday.group.title}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="admin-settings-card__status admin-settings-card__status--disconnected">
              <span className="admin-settings-card__status-dot admin-settings-card__status-dot--disconnected" />
              {monday.error || 'Not connected'}
            </div>
          )}
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-card__icon admin-settings-card__icon--klaviyo">
            K
          </div>
          <div className="admin-settings-card__title">Klaviyo</div>
          <div className="admin-settings-card__desc">
            Add newsletter subscribers and trigger automated email sequences for enquiry follow-ups.
          </div>

          {klaviyo.loading ? (
            <div className="admin-settings-card__status">
              <span className="admin-settings-card__status-dot admin-settings-card__status-dot--loading" />
              Checking...
            </div>
          ) : klaviyo.connected ? (
            <>
              <div className="admin-settings-card__status admin-settings-card__status--connected">
                <span className="admin-settings-card__status-dot admin-settings-card__status-dot--connected" />
                Connected{klaviyo.account?.name ? ` / ${klaviyo.account.name}` : ''}
              </div>

              {(enquiryList || newsletterList) && (
                <div className="admin-settings-card__lists">
                  {enquiryList && !enquiryList.error && (
                    <div className="admin-settings-card__list-item">
                      <span className="admin-settings-card__list-label">Enquiry list</span>
                      <span className="admin-settings-card__list-value">{enquiryList.name}</span>
                    </div>
                  )}
                  {newsletterList && !newsletterList.error && (
                    <div className="admin-settings-card__list-item">
                      <span className="admin-settings-card__list-label">Newsletter list</span>
                      <span className="admin-settings-card__list-value">{newsletterList.name}</span>
                    </div>
                  )}
                </div>
              )}

              <form className="admin-settings-card__test" onSubmit={handleTestSend}>
                <label className="admin-settings-card__test-label">Send test event</label>
                <div className="admin-settings-card__test-row">
                  <input
                    type="email"
                    className="admin-settings-card__test-input"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="admin-settings-card__test-btn"
                    disabled={testSending || !testEmail}
                  >
                    {testSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {testStatus && (
                  <div className={`admin-settings-card__test-result admin-settings-card__test-result--${testStatus.type}`}>
                    {testStatus.message}
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="admin-settings-card__status admin-settings-card__status--disconnected">
              <span className="admin-settings-card__status-dot admin-settings-card__status-dot--disconnected" />
              {klaviyo.error || 'Not connected'}
            </div>
          )}
        </div>
      </div>

      {/* Response Templates */}
      <div className="admin-settings-section">
        <h2 className="admin-settings-section__title">Response Templates</h2>
        <p className="admin-settings-section__desc">
          Templates used when rejecting enquiries. Available merge variables: <code>{'{{name}}'}</code>, <code>{'{{speaker_name}}'}</code>, <code>{'{{event_date}}'}</code>, <code>{'{{organization}}'}</code>
        </p>
      </div>

      {templateFeedback && !editingKey && (
        <div className={`admin-template-feedback admin-template-feedback--${templateFeedback.type}`}>
          {templateFeedback.message}
        </div>
      )}

      <div className="admin-templates">
        {templatesLoading ? (
          <div className="admin-templates__loading">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="admin-templates__empty">No templates found. Restart the server to seed defaults.</div>
        ) : templates.map(tmpl => (
          <div key={tmpl.reason_key} className="admin-template-card">
            <div className="admin-template-card__header">
              <div className="admin-template-card__label">{tmpl.label}</div>
              <span className="admin-template-card__key">{tmpl.reason_key}</span>
              {editingKey !== tmpl.reason_key && (
                <button
                  className="admin-template-card__edit-btn"
                  onClick={() => startEditing(tmpl)}
                >
                  Edit
                </button>
              )}
            </div>

            {editingKey === tmpl.reason_key ? (
              <div className="admin-template-card__editor">
                <label className="admin-template-card__field-label">Subject</label>
                <input
                  className="admin-template-card__subject-input"
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                />
                <label className="admin-template-card__field-label">Body</label>
                <textarea
                  className="admin-template-card__textarea"
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={10}
                />
                {templateFeedback && (
                  <div className={`admin-template-feedback admin-template-feedback--${templateFeedback.type}`}>
                    {templateFeedback.message}
                  </div>
                )}
                <div className="admin-template-card__actions">
                  <button
                    className="admin-template-card__btn--save"
                    onClick={() => saveTemplate(tmpl.reason_key)}
                    disabled={savingTemplate}
                  >
                    {savingTemplate ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="admin-template-card__btn--cancel"
                    onClick={cancelEditing}
                    disabled={savingTemplate}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-template-card__preview">
                {tmpl.body.length > 200 ? tmpl.body.slice(0, 200) + '...' : tmpl.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
