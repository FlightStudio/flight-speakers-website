import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../../constants/animation'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'invited', label: 'Invited' },
  { key: 'declined', label: 'Declined' },
]

const STATUS_COLORS = {
  new: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  reviewed: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  invited: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  declined: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
}

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || {}
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: style.bg,
        color: style.color,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  )
}

export default function AdminWaitlistPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [entries, setEntries] = useState([])
  const [counts, setCounts] = useState({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)
  const [inviteCopied, setInviteCopied] = useState(false)

  const fetchEntries = useCallback(async (status) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' })
      if (status && status !== 'all') params.set('status', status)
      const res = await fetch(`/api/admin/waitlist?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setEntries(data.entries)
        setTotal(data.total)
        setCounts(data.counts || {})
      } else {
        setError('Failed to load waitlist')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries(activeTab)
  }, [activeTab, fetchEntries])

  const openEntry = useCallback((entry) => {
    setSelectedEntry(entry)
    setEditStatus(entry.status)
    setEditNotes(entry.admin_notes || '')
    setInviteLink(entry.invited_token ? null : null) // reset link display; we'll show from entry data
    setInviteCopied(false)
  }, [])

  const closeEntry = useCallback(() => {
    setSelectedEntry(null)
    setEditStatus('')
    setEditNotes('')
    setInviteLink(null)
    setInviteCopied(false)
  }, [])

  const handleInvite = useCallback(async () => {
    if (!selectedEntry) return
    setInviting(true)
    try {
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1] || ''
      const res = await fetch(`/api/admin/waitlist/${selectedEntry.id}/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      })
      const data = await res.json()
      if (data.success) {
        setInviteLink(data.link)
        setSelectedEntry(data.entry)
        setEditStatus(data.entry.status)
        setEntries(prev => prev.map(e => e.id === data.entry.id ? data.entry : e))
      }
    } catch {
      // fail silently — link stays null
    } finally {
      setInviting(false)
    }
  }, [selectedEntry])

  const copyInviteLink = useCallback((link) => {
    navigator.clipboard.writeText(link).then(() => {
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    })
  }, [])

  const saveEntry = useCallback(async () => {
    if (!selectedEntry) return
    setSavingId(selectedEntry.id)
    try {
      const res = await fetch(`/api/admin/waitlist/${selectedEntry.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, admin_notes: editNotes }),
      })
      const data = await res.json()
      if (data.success) {
        setEntries(prev => prev.map(e => e.id === selectedEntry.id ? data.entry : e))
        setSelectedEntry(data.entry)
      }
    } catch {
      // fail silently for now
    } finally {
      setSavingId(null)
    }
  }, [selectedEntry, editStatus, editNotes])

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Speaker Waitlist</h1>
          <p className="admin-page__subtitle">Prospective speakers applying to join the roster</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(counts).map(([status, count]) => count > 0 && (
            <span key={status} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {count} {status}
            </span>
          ))}
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

      {/* Table */}
      {loading ? (
        <div className="admin-loading" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No entries yet.
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Based in</th>
                <th>Experience</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr
                  key={entry.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openEntry(entry)}
                >
                  <td style={{ fontWeight: 500 }}>{entry.full_name}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{entry.email}</td>
                  <td>{entry.based_in}</td>
                  <td>{entry.speaking_experience}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{entry.fee_currency} {entry.fee_bracket}</td>
                  <td><StatusBadge status={entry.status} /></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '0.75rem 1rem', fontSize: 12, color: 'var(--color-text-muted)' }}>
            {total} total {total === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: 40,
              }}
              onClick={closeEntry}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '560px', maxWidth: '92vw',
                background: 'var(--color-bg-primary)',
                borderLeft: '1px solid var(--color-border)',
                zIndex: 50,
                overflowY: 'auto',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h2 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 4 }}>{selectedEntry.full_name}</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{selectedEntry.email}</p>
                </div>
                <button onClick={closeEntry} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M14 4L4 14M4 4L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <DetailItem label="Based in" value={selectedEntry.based_in} />
                <DetailItem label="Title & company" value={selectedEntry.title_company} />
                <DetailItem label="Phone" value={selectedEntry.phone} />
                <DetailItem label="Experience" value={selectedEntry.speaking_experience} />
                <DetailItem label="Fee currency" value={selectedEntry.fee_currency} />
                <DetailItem label="Fee bracket" value={selectedEntry.fee_bracket} />
              </div>

              <DetailItem label="Speaks about" value={selectedEntry.speaks_about} />

              {selectedEntry.topics && selectedEntry.topics.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>Topics</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedEntry.topics.map(t => (
                      <span key={t} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-secondary)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <DetailItem label="Website" value={selectedEntry.website} link />
                <DetailItem label="LinkedIn" value={selectedEntry.linkedin} />
                <DetailItem label="Showreel" value={selectedEntry.showreel} link />
                <DetailItem label="Instagram" value={selectedEntry.instagram} />
              </div>

              {selectedEntry.notable_engagements && (
                <DetailItem label="Notable engagements" value={selectedEntry.notable_engagements} />
              )}

              <DetailItem label="Representation status" value={selectedEntry.representation_status} />

              {selectedEntry.why_flightspeakers && (
                <DetailItem label="Why FlightSpeakers" value={selectedEntry.why_flightspeakers} />
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

              {/* Invite to Roster */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Roster invite</div>

                {selectedEntry.invited_at && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Invited {new Date(selectedEntry.invited_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {/* Show copyable link if we just generated one, or if entry already has a token */}
                {(inviteLink || selectedEntry.invited_token) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 8,
                  }}>
                    <input
                      readOnly
                      value={inviteLink || `${window.location.origin}/speaker-portal#${selectedEntry.invited_token}`}
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        fontSize: 12, color: 'var(--color-text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => copyInviteLink(inviteLink || `${window.location.origin}/speaker-portal#${selectedEntry.invited_token}`)}
                      style={{
                        flexShrink: 0, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: inviteCopied ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)',
                        color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer',
                      }}
                    >
                      {inviteCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                {selectedEntry.status !== 'declined' && (
                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={inviting}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                      border: '1px solid rgba(34,197,94,0.3)', cursor: inviting ? 'not-allowed' : 'pointer',
                      opacity: inviting ? 0.7 : 1,
                    }}
                  >
                    {inviting ? 'Generating...' : selectedEntry.invited_token ? 'Re-invite (new link)' : 'Invite to Roster'}
                  </button>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

              {/* Admin controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', fontSize: 14 }}
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="invited">Invited</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>Admin notes</label>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="Internal notes..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', fontSize: 14, resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={saveEntry}
                  disabled={savingId === selectedEntry.id}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end' }}
                >
                  {savingId === selectedEntry.id ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DetailItem({ label, value, link = false }) {
  if (!value) return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Not provided</div>
    </div>
  )
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      {link ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 14, color: 'var(--color-accent, #3b82f6)', wordBreak: 'break-all' }}>{value}</a>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</div>
      )}
    </div>
  )
}
