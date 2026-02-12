import { motion } from 'framer-motion'
import { FIELD_STEP_MAP, CURRENCIES } from '../../../hooks/useMultiStepForm'

const EASE = [0.16, 1, 0.3, 1]

const FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'organization', label: 'Organization' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'eventType', label: 'Event Type' },
  { key: 'eventDate', label: 'Date' },
  { key: 'eventLocation', label: 'Location' },
  { key: 'audienceSize', label: 'Audience' },
  { key: 'engagementType', label: 'Paid / Pro Bono', format: (val, data) => {
    if (!val) return null
    if (val === 'Pro Bono' && data.proBonoFlexible) return 'Pro Bono (subject to change)'
    return val
  }},
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

function StepReview({ formData, handleChange, goToStep, recommendedSpeakers = [], recommendedScores = {}, onToggleSpeaker }) {
  const selectedIds = formData.additionalSpeakerIds || []
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
          if (!display && (key === 'budgetRange' || key === 'hasBudget')) return null
          return (
            <button
              key={key}
              type="button"
              className="mstep-review__cell"
              onClick={() => goToStep(FIELD_STEP_MAP[key])}
            >
              <span className="mstep-review__label">{label}</span>
              <span className={`mstep-review__value${!display ? ' mstep-review__value--empty' : ''}`}>
                {display || '—'}
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
      </motion.div>

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
