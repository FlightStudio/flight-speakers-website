import { motion } from 'framer-motion'
import { FIELD_STEP_MAP, CURRENCIES } from '../../../hooks/useMultiStepForm'
import { EASE } from '../../../constants/animation'
import { formatEventDate } from '../../../utils/dateFormat'

const FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'organization', label: 'Organization' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'eventType', label: 'Event Type' },
  { key: 'eventName', label: 'Event Name' },
  { key: 'eventDate', label: 'Date', format: (val) => formatEventDate(val) },
  { key: 'eventLocation', label: 'Location' },
  { key: 'audienceSize', label: 'Audience' },
  { key: 'engagementType', label: 'Paid / Pro Bono' },
  { key: 'budgetRange', label: 'Budget', format: (val, data) => {
    if (!val) return null
    // Custom numeric value — format with currency symbol
    if (/^\d+$/.test(val)) {
      const curr = CURRENCIES.find(c => c.code === data.currency) || CURRENCIES[0]
      return `${curr.symbol}${parseInt(val).toLocaleString()}`
    }
    // Preset range already includes currency symbol from getBudgetRanges
    return val
  }},
]

function StepReview({ formData, handleChange, goToStep, primarySpeaker = null, preSelectedSpeakers = [], recommendedSpeakers = [], recommendedScores = {}, onToggleSpeaker, recsLoading = false }) {
  const selectedIds = formData.additionalSpeakerIds || []
  // budgetRange isn't a direct step field — map it to the engagementType step
  const getStepIndex = (key) => FIELD_STEP_MAP[key] ?? FIELD_STEP_MAP['engagementType']

  // Build visible speakers: primary first, then pre-selected (only if still in additionalSpeakerIds),
  // then AI recommendations the user toggled on. Deduplicate by id.
  const additionalIds = formData.additionalSpeakerIds || []
  const seen = new Set()
  const visibleSpeakers = []
  if (primarySpeaker) {
    visibleSpeakers.push(primarySpeaker)
    seen.add(primarySpeaker.id)
  }
  for (const s of preSelectedSpeakers) {
    if (!seen.has(s.id) && additionalIds.includes(s.id)) {
      visibleSpeakers.push(s)
      seen.add(s.id)
    }
  }
  for (const s of recommendedSpeakers) {
    if (additionalIds.includes(s.id) && !seen.has(s.id)) {
      visibleSpeakers.push(s)
      seen.add(s.id)
    }
  }
  return (
    <div className="mstep-review mstep-review--compact">
      <motion.div
        className="mstep-review__grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {FIELDS.map(({ key, label, format }) => {
          const raw = formData[key]
          const display = format ? format(raw, formData) : raw
          // Skip hidden conditional fields with no value
          if (!display && key === 'budgetRange') return null
          return (
            <button
              key={key}
              type="button"
              className="mstep-review__cell"
              onClick={() => goToStep(getStepIndex(key))}
            >
              <span className="mstep-review__label">{label}</span>
              <span className={`mstep-review__value${!display ? ' mstep-review__value--empty' : ''}`}>
                {display || '-'}
              </span>
            </button>
          )
        })}

        {/* Brief spans full width */}
        {formData.brief && (
          <button
            type="button"
            className="mstep-review__cell mstep-review__cell--wide"
            onClick={() => goToStep(FIELD_STEP_MAP.brief)}
          >
            <span className="mstep-review__label">Brief</span>
            <span className="mstep-review__value mstep-review__brief">{formData.brief}</span>
          </button>
        )}
        {formData.additionalDetails && (
          <button
            type="button"
            className="mstep-review__cell mstep-review__cell--wide"
            onClick={() => goToStep(FIELD_STEP_MAP.additionalDetails)}
          >
            <span className="mstep-review__label">Additional Details</span>
            <span className="mstep-review__value mstep-review__brief">{formData.additionalDetails}</span>
          </button>
        )}
      </motion.div>

      {visibleSpeakers.length > 0 && (
        <motion.div
          className="mstep-review__selected"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: EASE }}
        >
          <div className="mstep-review__selected-header">
            Speakers in your enquiry ({visibleSpeakers.length})
          </div>
          <ul className="mstep-review__selected-list">
            {visibleSpeakers.map((s) => {
              const isPrimary = primarySpeaker && s.id === primarySpeaker.id
              return (
                <li key={s.id} className="mstep-review__selected-card">
                  <img src={s.photo} alt={s.name} className="mstep-review__selected-photo" />
                  <div className="mstep-review__selected-info">
                    <span className="mstep-review__selected-name">{s.name}</span>
                    <span className="mstep-review__selected-headline">{s.headline}</span>
                    {s.topics?.length > 0 && (
                      <span className="mstep-review__selected-topics">
                        {s.topics.slice(0, 3).join(' / ')}
                      </span>
                    )}
                  </div>
                  {!isPrimary && onToggleSpeaker && (
                    <button
                      type="button"
                      className="mstep-review__selected-remove"
                      onClick={() => onToggleSpeaker(s.id)}
                      aria-label={`Remove ${s.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </motion.div>
      )}

      {recommendedSpeakers.length === 0 && !formData.brief && !recsLoading && (
        <motion.div
          className="mstep-review__recs mstep-review__recs--hint"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
        >
          <div className="mstep-review__recs-header">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
            </svg>
            <span>Add a brief to get AI-recommended speakers</span>
          </div>
          <div className="mstep-review__recs-grid">
            {[1, 2, 3].map(i => (
              <button
                key={i}
                type="button"
                className="mstep-review__rec mstep-review__rec--placeholder"
                onClick={() => goToStep(FIELD_STEP_MAP.brief)}
              >
                <div className="mstep-review__rec-photo mstep-review__rec-photo--skeleton" />
                <div className="mstep-review__rec-info">
                  <span className="mstep-review__rec-name mstep-review__rec-name--skeleton" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {recommendedSpeakers.length === 0 && (recsLoading || formData.brief) && (
        <motion.div
          className="mstep-review__recs"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
        >
          <div className="mstep-review__recs-header">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
            </svg>
            <span>Finding recommended speakers...</span>
          </div>
          <div className="mstep-review__recs-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="mstep-review__rec mstep-review__rec--skeleton">
                <div className="mstep-review__rec-photo mstep-review__rec-photo--skeleton" />
                <div className="mstep-review__rec-info">
                  <span className="mstep-review__rec-name mstep-review__rec-name--skeleton" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {recommendedSpeakers.length > 0 && (
        <motion.div
          className="mstep-review__recs"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
        >
          <div className="mstep-review__recs-header">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
            </svg>
            <span>Also recommended for your brief</span>
          </div>
          <div className="mstep-review__recs-grid">
            {recommendedSpeakers.map((s) => {
              const isSelected = selectedIds.includes(s.id)
              const score = recommendedScores[s.id]
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`mstep-review__rec${isSelected ? ' mstep-review__rec--selected' : ''}`}
                  onClick={() => onToggleSpeaker?.(s.id)}
                >
                  <img src={s.photo} alt={s.name} className="mstep-review__rec-photo" />
                  <div className="mstep-review__rec-info">
                    <span className="mstep-review__rec-name">{s.name}</span>
                    {score != null && (
                      <span className="mstep-review__rec-score">{score}% match</span>
                    )}
                  </div>
                  <span className={`mstep-review__rec-toggle${isSelected ? ' mstep-review__rec-toggle--active' : ''}`}>
                    {isSelected ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
          {selectedIds.length > 0 && (
            <p className="mstep-review__recs-note">
              {selectedIds.length} additional speaker{selectedIds.length !== 1 ? 's' : ''} will be included in your enquiry
            </p>
          )}
        </motion.div>
      )}

      <motion.div
        className="mstep-review__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {formData.engagementType === 'Pro Bono' && (
          <label className="mstep-review__checkbox">
            <input
              type="checkbox"
              name="proBonoFlexible"
              checked={formData.proBonoFlexible || false}
              onChange={handleChange}
            />
            <span>Pro bono for now, but subject to change</span>
          </label>
        )}

        <label className="mstep-review__checkbox">
          <input
            type="checkbox"
            name="newsletter"
            checked={formData.newsletter}
            onChange={handleChange}
          />
          <span>Keep me updated on speaker news and insights</span>
        </label>

        <p className="mstep-review__privacy">
          By submitting, you agree to our privacy policy. We'll never share your information.
        </p>
      </motion.div>
    </div>
  )
}

export default StepReview
