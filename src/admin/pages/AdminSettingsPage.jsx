import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

export default function AdminSettingsPage() {
  const [klaviyo, setKlaviyo] = useState({ loading: true })
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState(null) // { type: 'success' | 'error', message }
  const [testSending, setTestSending] = useState(false)

  useEffect(() => {
    fetch('/api/admin/integrations/klaviyo', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setKlaviyo({ loading: false, ...data }))
      .catch(() => setKlaviyo({ loading: false, connected: false, error: 'Failed to fetch' }))
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
        <h1 className="admin-page__title">Integrations</h1>
        <p className="admin-page__subtitle">Manage integrations and preferences</p>
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
          <div className="admin-settings-card__status">
            <span className="admin-settings-card__status-dot" />
            Not connected
          </div>
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
    </motion.div>
  )
}
