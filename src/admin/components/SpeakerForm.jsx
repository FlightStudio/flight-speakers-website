import { useState, useCallback } from 'react'

const GENDER_OPTIONS = ['', 'Male', 'Female', 'Non-binary', 'Prefer not to say']

function TagInput({ label, value, onChange }) {
  const [input, setInput] = useState('')

  function handleKeyDown(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()])
      }
      setInput('')
    }
  }

  function handleRemove(tag) {
    onChange(value.filter(t => t !== tag))
  }

  return (
    <div className="spkr-form__field">
      <label className="spkr-form__label">{label}</label>
      <div className="spkr-form__tags">
        {value.map(tag => (
          <span key={tag} className="spkr-form__tag">
            {tag}
            <button
              type="button"
              className="spkr-form__tag-remove"
              onClick={() => handleRemove(tag)}
            >
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
        placeholder={`Type and press Enter to add`}
      />
    </div>
  )
}

export default function SpeakerForm({ initialData, onSubmit, saving, portalMode = false, submitLabel }) {
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
      socialProfiles: { instagram: '', x: '', linkedin: '', youtube: '', tiktok: '' },
    }
    if (!initialData) return defaults
    return {
      ...defaults,
      ...initialData,
      feeMin: initialData.feeMin ?? '',
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

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      ...form,
      feeMin: form.feeMin === '' ? null : parseInt(form.feeMin, 10),
      gender: form.gender || null,
      ethnicity: form.ethnicity || null,
      nationality: form.nationality || null,
      location: form.location || null,
    }
    onSubmit(data)
  }

  return (
    <form className="spkr-form" onSubmit={handleSubmit}>
      <div className="spkr-form__grid">
        {/* Name */}
        <div className="spkr-form__field">
          <label className="spkr-form__label">Name *</label>
          <input
            className="spkr-form__input"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />
        </div>

        {/* Headline */}
        <div className="spkr-form__field">
          <label className="spkr-form__label">Headline *</label>
          <input
            className="spkr-form__input"
            value={form.headline}
            onChange={e => set('headline', e.target.value)}
            required
          />
        </div>

        {/* Photo URL */}
        <div className="spkr-form__field">
          <label className="spkr-form__label">Photo URL *</label>
          <div className="spkr-form__photo-row">
            <input
              className="spkr-form__input"
              value={form.photo}
              onChange={e => set('photo', e.target.value)}
              placeholder="https://..."
              required={!portalMode}
            />
            {form.photo && (
              <img src={form.photo} alt="Preview" className="spkr-form__photo-preview" />
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="spkr-form__field spkr-form__field--full">
          <label className="spkr-form__label">Bio *</label>
          <textarea
            className="spkr-form__textarea"
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            rows={6}
            required
          />
        </div>

        {/* Tags */}
        <TagInput label="Topics" value={form.topics} onChange={v => set('topics', v)} />
        <TagInput label="Audiences" value={form.audiences} onChange={v => set('audiences', v)} />
        <TagInput label="Keynotes" value={form.keynotes} onChange={v => set('keynotes', v)} />

        {/* Speaking Format */}
        <div className="spkr-form__field">
          <label className="spkr-form__label">Speaking Format</label>
          <input
            className="spkr-form__input"
            value={form.speakingFormat || ''}
            onChange={e => set('speakingFormat', e.target.value)}
            placeholder="e.g., 45min keynote + Q&A"
          />
        </div>

        {/* Video URL */}
        <div className="spkr-form__field">
          <label className="spkr-form__label">Video URL</label>
          <input
            className="spkr-form__input"
            value={form.videoUrl || ''}
            onChange={e => set('videoUrl', e.target.value)}
            placeholder="https://youtube.com/embed/..."
          />
        </div>

        {/* Fee — admin only */}
        {!portalMode && (
          <div className="spkr-form__field">
            <label className="spkr-form__label">Fee Min ($)</label>
            <input
              type="number"
              className="spkr-form__input"
              value={form.feeMin}
              onChange={e => set('feeMin', e.target.value)}
              placeholder="-"
            />
          </div>
        )}

        {/* Demographics */}
        <div className="spkr-form__field">
          <label className="spkr-form__label">Gender</label>
          <select
            className="spkr-form__select"
            value={form.gender || ''}
            onChange={e => set('gender', e.target.value)}
          >
            {GENDER_OPTIONS.map(g => (
              <option key={g} value={g}>{g || 'Select'}</option>
            ))}
          </select>
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Ethnicity</label>
          <input
            className="spkr-form__input"
            value={form.ethnicity || ''}
            onChange={e => set('ethnicity', e.target.value)}
          />
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Nationality</label>
          <input
            className="spkr-form__input"
            value={form.nationality || ''}
            onChange={e => set('nationality', e.target.value)}
          />
        </div>

        <div className="spkr-form__field">
          <label className="spkr-form__label">Location</label>
          <input
            className="spkr-form__input"
            value={form.location || ''}
            onChange={e => set('location', e.target.value)}
            placeholder="e.g., London, UK"
          />
        </div>
      </div>

      {/* Social Profiles */}
      <div className="spkr-form__section">
        <button
          type="button"
          className="spkr-form__section-toggle"
          onClick={() => setShowSocial(!showSocial)}
        >
          Social Profiles {showSocial ? '−' : '+'}
        </button>
        {showSocial && (
          <div className="spkr-form__social-grid">
            {['instagram', 'x', 'linkedin', 'youtube', 'tiktok'].map(platform => (
              <div key={platform} className="spkr-form__field">
                <label className="spkr-form__label">{platform}</label>
                <input
                  className="spkr-form__input"
                  value={form.socialProfiles?.[platform] || ''}
                  onChange={e => setSocial(platform, e.target.value)}
                  placeholder={`@username`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="spkr-form__actions">
        <button
          type="submit"
          className="spkr-form__submit"
          disabled={saving}
        >
          {saving ? 'Submitting...' : submitLabel || (portalMode ? 'Submit for Review' : (initialData ? 'Submit Update' : 'Submit New Speaker'))}
        </button>
      </div>
    </form>
  )
}
