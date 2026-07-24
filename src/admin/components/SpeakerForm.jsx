import { useState, useCallback, useRef } from 'react'

const GENDER_OPTIONS = ['', 'Male', 'Female', 'Non-binary', 'Prefer not to say']
const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'x', 'linkedin', 'youtube', 'tiktok']

// Mirrors isYouTubeUrl in server/routes/admin/_youtube.js — decides whether the
// link tab shows the quality picker (YouTube) or a plain download (direct file).
function isYouTubeUrl(str) {
  let parsed
  try {
    parsed = new URL(str)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  return /^(www\.|m\.|music\.)?youtube\.com$|^youtu\.be$|^(www\.)?youtube-nocookie\.com$/i.test(parsed.hostname)
}

function TagInput({ label, value, onChange }) {
  const [input, setInput] = useState('')

  function handleKeyDown(e) {
    if (e.key !== 'Enter' || !input.trim()) return
    e.preventDefault()
    if (!value.includes(input.trim())) {
      onChange([...value, input.trim()])
    }
    setInput('')
  }

  return (
    <div className="spkr-form__field">
      <label className="spkr-form__label">{label}</label>
      <div className="spkr-form__tags">
        {value.map(tag => (
          <span key={tag} className="spkr-form__tag">
            {tag}
            <button type="button" className="spkr-form__tag-remove" onClick={() => onChange(value.filter(t => t !== tag))}>
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        className="spkr-form__input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add"
      />
    </div>
  )
}

function DropZone({ label, accept, preview, emptyIcon, uploadingText, idleText, dragOverClass, onUpload, error, actions }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="spkr-form__field spkr-form__field--full">
      <label className="spkr-form__label">{label}</label>
      <div
        className={`spkr-form__dropzone${dragOver ? ` ${dragOverClass}` : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onUpload(e.dataTransfer.files[0]) }}
      >
        {preview || (
          <div className="spkr-form__dropzone-empty">{emptyIcon}</div>
        )}
        <div className="spkr-form__dropzone-text">
          {uploadingText || idleText}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => onUpload(e.target.files[0])}
        />
      </div>
      {actions}
      {error && (
        <small className="spkr-form__help" style={{ color: '#ef4444' }}>{error}</small>
      )}
    </div>
  )
}

const UPLOAD_ICON = (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
    <path d="M8 1v10M4 5l4-4 4 4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PLAY_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

function useVideoLinkUpload(speakerId, setFormField) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = useCallback(async (url, quality) => {
    if (!url) return
    const endpoint = speakerId
      ? `/api/admin/speakers/${speakerId}/video-url`
      : `/api/admin/uploads/video-url`
    setUploading(true)
    setError(null)
    try {
      // quality is only sent for YouTube links; direct files ignore it.
      const body = quality ? { url, quality } : { url }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || 'Download failed')
      setFormField('videoUrl', result.videoUrl)
    } catch (err) {
      console.error('video link download failed:', err)
      setError(err.message || 'Download failed')
    } finally {
      setUploading(false)
    }
  }, [speakerId, setFormField])

  return { upload, uploading, error }
}

// Fetches the available qualities for a YouTube URL so the admin can pick one
// before downloading. No DB write — the same endpoint serves new + existing
// speakers.
function useYouTubeProbe() {
  const [formats, setFormats] = useState([])
  const [title, setTitle] = useState('')
  const [probing, setProbing] = useState(false)
  const [error, setError] = useState(null)

  const probe = useCallback(async (url) => {
    setProbing(true)
    setError(null)
    setFormats([])
    setTitle('')
    try {
      const res = await fetch('/api/admin/youtube/formats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || 'Could not load qualities')
      setFormats(result.formats || [])
      setTitle(result.title || '')
    } catch (err) {
      console.error('youtube probe failed:', err)
      setError(err.message || 'Could not load qualities')
    } finally {
      setProbing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setFormats([])
    setTitle('')
    setError(null)
  }, [])

  return { probe, reset, formats, title, probing, error }
}

function useFileUpload(speakerId, endpoint, fieldName, formFieldKey, setFormField) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  // Tracks the most recent upload so out-of-order responses can't win. If a
  // user picks a second file before the first finishes, both POSTs race and
  // whichever resolves last would otherwise set the field — showing/saving the
  // wrong image. Only the latest request is allowed to touch state.
  const latestRequestId = useRef(0)

  const upload = useCallback(async (file) => {
    if (!file) return
    const requestId = ++latestRequestId.current
    // Existing speakers write directly; new speakers use staged uploads (no DB
    // write until draft approval). Uses fetch so installAdminFetch injects CSRF.
    const url = speakerId
      ? `/api/admin/speakers/${speakerId}/${endpoint}`
      : `/api/admin/uploads/${endpoint}`
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append(fieldName, file)
      const res = await fetch(url, { method: 'POST', body })
      const result = await res.json()
      if (requestId !== latestRequestId.current) return
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Upload failed')
      }
      setFormField(formFieldKey, result[formFieldKey] || result.photo || result.videoUrl)
    } catch (err) {
      if (requestId !== latestRequestId.current) return
      console.error(`${endpoint} upload failed:`, err)
      setError(err.message || 'Upload failed')
    } finally {
      if (requestId === latestRequestId.current) setUploading(false)
    }
  }, [speakerId, endpoint, fieldName, formFieldKey, setFormField])

  return { upload, uploading, error }
}

export default function SpeakerForm({ initialData, onSubmit, saving, portalMode = false, submitLabel, speakerId }) {
  const [form, setForm] = useState(() => {
    const defaults = {
      name: '',
      headline: '',
      photo: '',
      bio: '',
      topics: [],
      audiences: [],
      keynotes: [],
      speakingFormat: '',
      videoUrl: '',
      feeMin: '',
      gender: '',
      ethnicity: '',
      nationality: '',
      location: '',
      socialProfiles: { instagram: '', facebook: '', x: '', linkedin: '', youtube: '', tiktok: '' },
      boostNotes: '',
      heroMediaType: 'video',
      hidden: false,
    }
    if (!initialData) return defaults
    return {
      ...defaults,
      ...initialData,
      feeMin: initialData.feeMin ?? '',
      boostNotes: initialData.boostNotes ?? '',
      heroMediaType: initialData.heroMediaType ?? (initialData.videoUrl ? 'video' : 'image'),
      hidden: initialData.hidden ?? false,
    }
  })

  const [showSocial, setShowSocial] = useState(false)

  const set = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const setSocial = useCallback((platform, value) => {
    setForm(prev => ({
      ...prev,
      socialProfiles: { ...prev.socialProfiles, [platform]: value },
    }))
  }, [])

  const photo = useFileUpload(speakerId, 'photo', 'photo', 'photo', set)
  const video = useFileUpload(speakerId, 'video', 'video', 'videoUrl', set)

  // AI background removal — sends the current photo URL to the server, which
  // runs it through OpenAI and returns a staged transparent PNG. The speaker
  // record only changes when the form is saved.
  const [removingBg, setRemovingBg] = useState(false)
  const [removeBgError, setRemoveBgError] = useState(null)

  const removeBackground = useCallback(async () => {
    setRemovingBg(true)
    setRemoveBgError(null)
    try {
      const res = await fetch('/api/admin/uploads/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: form.photo }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Background removal failed')
      }
      set('photo', result.photo)
    } catch (err) {
      console.error('Background removal failed:', err)
      setRemoveBgError(err.message || 'Background removal failed')
    } finally {
      setRemovingBg(false)
    }
  }, [form.photo, set])
  const videoLink = useVideoLinkUpload(speakerId, set)
  const ytProbe = useYouTubeProbe()

  const [videoInputMode, setVideoInputMode] = useState('upload')
  const [videoLinkUrl, setVideoLinkUrl] = useState('')
  const [videoQuality, setVideoQuality] = useState('')
  const [videoDragOver, setVideoDragOver] = useState(false)
  const videoFileInputRef = useRef(null)

  const isYouTubeLink = isYouTubeUrl(videoLinkUrl.trim())

  function handleVideoLinkChange(value) {
    setVideoLinkUrl(value)
    // A changed URL invalidates any previously probed qualities.
    if (ytProbe.formats.length || ytProbe.title) ytProbe.reset()
    if (videoQuality) setVideoQuality('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { hidden, ...rest } = form
    const payload = {
      ...rest,
      feeMin: form.feeMin === '' ? null : parseInt(form.feeMin, 10),
      gender: form.gender || null,
      ethnicity: form.ethnicity || null,
      nationality: form.nationality || null,
      location: form.location || null,
      heroMediaType: form.heroMediaType,
    }
    if (!portalMode) payload.hidden = !!hidden
    onSubmit(payload)
  }

  return (
    <form className="spkr-form" onSubmit={handleSubmit}>
      <div className="spkr-form__grid">
        <div className="spkr-form__field">
          <label className="spkr-form__label">Name *</label>
          <input className="spkr-form__input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Headline *</label>
          <input className="spkr-form__input" value={form.headline} onChange={e => set('headline', e.target.value)} required />
        </div>

        <DropZone
          label={`Photo${portalMode ? '' : ' *'}`}
          accept="image/*"
          preview={form.photo && <img src={form.photo} alt="Preview" className="spkr-form__dropzone-img-preview" />}
          emptyIcon={UPLOAD_ICON}
          uploadingText={photo.uploading ? 'Uploading...' : null}
          idleText="Click or drag to upload photo"
          dragOverClass="spkr-form__dropzone--drag"
          onUpload={photo.upload}
          error={photo.error}
          actions={form.photo && (
            <div className="spkr-form__photo-tools">
              <button
                type="button"
                className="spkr-form__nobg-btn"
                onClick={removeBackground}
                disabled={removingBg || photo.uploading}
              >
                {removingBg ? (
                  <>
                    <span className="spkr-form__nobg-spinner" />
                    Removing background…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 13L13 3M5.5 3H3v2.5M13 10.5V13h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Remove background
                  </>
                )}
              </button>
              {removeBgError && (
                <small className="spkr-form__help" style={{ color: '#ef4444' }}>{removeBgError}</small>
              )}
            </div>
          )}
        />

        <div className="spkr-form__field spkr-form__field--full">
          <label className="spkr-form__label">Hero media (shown on speaker profile)</label>
          <div className="spkr-form__hero-toggle" role="radiogroup" aria-label="Hero media type">
            <button
              type="button"
              role="radio"
              aria-checked={form.heroMediaType === 'image'}
              className={`spkr-form__hero-option${form.heroMediaType === 'image' ? ' spkr-form__hero-option--active' : ''}`}
              onClick={() => set('heroMediaType', 'image')}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="5" cy="6" r="1.2" fill="currentColor"/>
                <path d="M2 11l3.5-3 3 2.5L11 8l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Use image
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={form.heroMediaType === 'video'}
              className={`spkr-form__hero-option${form.heroMediaType === 'video' ? ' spkr-form__hero-option--active' : ''}`}
              onClick={() => set('heroMediaType', 'video')}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11.5 6.5L14.5 5v6l-3-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Use video
            </button>
          </div>
          <small className="spkr-form__help">
            {form.heroMediaType === 'video'
              ? 'The sizzle reel below will play full-bleed on the profile hero. Falls back to image if no video uploaded.'
              : 'The photo above will fill the profile hero.'}
          </small>
        </div>

        <div className="spkr-form__field spkr-form__field--full">
          <div className="spkr-form__label-row">
            <label className="spkr-form__label">Sizzle Reel</label>
            <div className="spkr-form__video-tabs" role="group">
              <button
                type="button"
                className={`spkr-form__video-tab${videoInputMode === 'upload' ? ' spkr-form__video-tab--active' : ''}`}
                onClick={() => setVideoInputMode('upload')}
              >Upload file</button>
              <button
                type="button"
                className={`spkr-form__video-tab${videoInputMode === 'link' ? ' spkr-form__video-tab--active' : ''}`}
                onClick={() => setVideoInputMode('link')}
              >Paste link</button>
            </div>
          </div>

          {videoInputMode === 'upload' ? (
            <div
              className={`spkr-form__dropzone${videoDragOver ? ' spkr-form__dropzone--drag' : ''}`}
              onClick={() => videoFileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true) }}
              onDragLeave={() => setVideoDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setVideoDragOver(false); video.upload(e.dataTransfer.files[0]) }}
            >
              {form.videoUrl
                ? <video src={form.videoUrl} className="spkr-form__dropzone-vid-preview" muted playsInline />
                : <div className="spkr-form__dropzone-empty">{PLAY_ICON}</div>
              }
              <div className="spkr-form__dropzone-text">
                {video.uploading ? 'Uploading…' : (form.videoUrl ? 'Click or drag to replace video' : 'Click or drag to upload sizzle reel (MP4, WebM, MOV)')}
              </div>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => video.upload(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="spkr-form__video-link">
              {form.videoUrl && (
                <video src={form.videoUrl} className="spkr-form__dropzone-vid-preview" muted playsInline />
              )}
              <div className="spkr-form__video-link-row">
                <input
                  className="spkr-form__input"
                  type="url"
                  value={videoLinkUrl}
                  onChange={e => handleVideoLinkChange(e.target.value)}
                  placeholder="YouTube link or https://example.com/video.mp4"
                  disabled={videoLink.uploading}
                />
                {isYouTubeLink && ytProbe.formats.length === 0 ? (
                  <button
                    type="button"
                    className="spkr-form__video-link-btn"
                    disabled={ytProbe.probing || !videoLinkUrl.trim()}
                    onClick={() => ytProbe.probe(videoLinkUrl.trim())}
                  >
                    {ytProbe.probing ? 'Loading…' : 'Load qualities'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="spkr-form__video-link-btn"
                    disabled={
                      videoLink.uploading ||
                      !videoLinkUrl.trim() ||
                      (isYouTubeLink && !videoQuality)
                    }
                    onClick={() => videoLink.upload(videoLinkUrl.trim(), isYouTubeLink ? videoQuality : undefined)}
                  >
                    {videoLink.uploading ? 'Downloading…' : 'Download & Store'}
                  </button>
                )}
              </div>

              {isYouTubeLink && ytProbe.formats.length > 0 && (
                <div className="spkr-form__video-link-quality">
                  {ytProbe.title && (
                    <small className="spkr-form__help">{ytProbe.title}</small>
                  )}
                  <select
                    className="spkr-form__select"
                    value={videoQuality}
                    onChange={e => setVideoQuality(e.target.value)}
                    disabled={videoLink.uploading}
                  >
                    <option value="">Select quality…</option>
                    {ytProbe.formats.map(f => (
                      <option key={f.height} value={f.height}>{f.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {videoInputMode === 'upload' && video.error && (
            <small className="spkr-form__help" style={{ color: '#ef4444' }}>{video.error}</small>
          )}
          {videoInputMode === 'link' && (videoLink.error || ytProbe.error) && (
            <small className="spkr-form__help" style={{ color: '#ef4444' }}>{videoLink.error || ytProbe.error}</small>
          )}
        </div>

        <div className="spkr-form__field spkr-form__field--full">
          <label className="spkr-form__label">Bio *</label>
          <textarea className="spkr-form__textarea" value={form.bio} onChange={e => set('bio', e.target.value)} rows={6} required />
        </div>

        <TagInput label="Topics" value={form.topics} onChange={v => set('topics', v)} />
        <TagInput label="Audiences" value={form.audiences} onChange={v => set('audiences', v)} />
        <TagInput label="Keynotes" value={form.keynotes} onChange={v => set('keynotes', v)} />

        <div className="spkr-form__field">
          <label className="spkr-form__label">Speaking Format</label>
          <input className="spkr-form__input" value={form.speakingFormat || ''} onChange={e => set('speakingFormat', e.target.value)} placeholder="e.g., 45min keynote + Q&A" />
        </div>

        {!portalMode && (
          <div className="spkr-form__field">
            <label className="spkr-form__label">Fee Min ($)</label>
            <input type="number" className="spkr-form__input" value={form.feeMin} onChange={e => set('feeMin', e.target.value)} placeholder="-" />
          </div>
        )}

        <div className="spkr-form__field">
          <label className="spkr-form__label">Gender</label>
          <select className="spkr-form__select" value={form.gender || ''} onChange={e => set('gender', e.target.value)}>
            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g || 'Select'}</option>)}
          </select>
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Ethnicity</label>
          <input className="spkr-form__input" value={form.ethnicity || ''} onChange={e => set('ethnicity', e.target.value)} />
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Nationality</label>
          <input className="spkr-form__input" value={form.nationality || ''} onChange={e => set('nationality', e.target.value)} />
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Location</label>
          <input className="spkr-form__input" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g., London, UK" />
        </div>
      </div>

      <div className="spkr-form__section">
        <button type="button" className="spkr-form__section-toggle" onClick={() => setShowSocial(!showSocial)}>
          Social Profiles {showSocial ? '−' : '+'}
        </button>
        {showSocial && (
          <div className="spkr-form__social-grid">
            {SOCIAL_PLATFORMS.map(platform => (
              <div key={platform} className="spkr-form__field">
                <label className="spkr-form__label">{platform}</label>
                <input className="spkr-form__input" value={form.socialProfiles?.[platform] || ''} onChange={e => setSocial(platform, e.target.value)} placeholder="@username" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="spkr-form__divider" aria-hidden="true" />

      {!portalMode && (
        <div className="spkr-form__field spkr-form__field--internal">
          <label className="spkr-form__checkbox">
            <input
              type="checkbox"
              className="spkr-form__checkbox-input"
              checked={!!form.hidden}
              onChange={e => set('hidden', e.target.checked)}
            />
            <span className="spkr-form__checkbox-text">
              <span className="spkr-form__checkbox-title">Hide from site temporarily</span>
              <small className="spkr-form__help">
                Removes this speaker from the public listing, profile page, search and
                recommendations without deleting them. Uncheck to bring them back.
              </small>
            </span>
          </label>
        </div>
      )}

      <div className="spkr-form__field spkr-form__field--internal">
        <label className="spkr-form__label spkr-form__label--internal" htmlFor="boostNotes">
          <span className="spkr-form__lock-icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 5V3.5a1.5 1.5 0 1 1 3 0V5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </span>
          AI Boost Notes (internal — not shown to users)
        </label>
        <textarea
          id="boostNotes"
          name="boostNotes"
          className="spkr-form__textarea"
          rows={3}
          value={form.boostNotes || ''}
          onChange={e => set('boostNotes', e.target.value)}
          placeholder="e.g. Has delivered 3 health-focused keynotes; Especially strong with C-suite audiences"
        />
        <small className="spkr-form__help">
          Hidden context that influences AI search ranking. Soft signal, not a hard filter.
        </small>
      </div>

      <div className="spkr-form__actions">
        <button type="submit" className="spkr-form__submit" disabled={saving}>
          { saving ? 'Submitting...'
            : submitLabel || (
              portalMode ? 'Submit for Review'
                : (
                  initialData ? 'Submit Update'
                    : 'Submit New Speaker'
                )
            )
          }
        </button>
      </div>
    </form>
  )
}
