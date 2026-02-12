import { motion } from 'framer-motion'
import { FIELD_STEP_MAP } from '../../../hooks/useMultiStepForm'

const EASE = [0.16, 1, 0.3, 1]

const FIELD_LABELS = {
  eventType: 'Event Type',
  eventDate: 'Event Date',
  eventLocation: 'Location',
  audienceSize: 'Audience Size',
  budgetRange: 'Budget',
}

function StepConfirmPrefill({ extractedData, brief, isParsing = false, onConfirm, onEditField }) {
  const fields = Object.entries(extractedData).filter(
    ([key, value]) => value && FIELD_LABELS[key]
  )
  // budgetRange isn't a direct step field — map it to the engagementType step
  const getStepIndex = (key) =>
    FIELD_STEP_MAP[key] ?? FIELD_STEP_MAP['engagementType']

  const hasExtracted = fields.length > 0

  return (
    <motion.div
      className="mstep-prefill"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="mstep-prefill__header">
        <div className="mstep-prefill__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="mstep-prefill__title">
          {isParsing ? 'Reading your brief...' : 'Check these details'}
        </h3>
        {isParsing && (
          <p className="mstep-prefill__subtitle">
            Extracting event details — just a moment.
          </p>
        )}
      </div>

      {isParsing && !hasExtracted ? (
        <div className="mstep-prefill__loading">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="mstep-prefill__skeleton"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      ) : (
        <div className="mstep-prefill__fields">
          {fields.map(([key, value], i) => (
            <motion.div
              key={key}
              className="mstep-prefill__field"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1, ease: EASE }}
            >
              <div className="mstep-prefill__field-content">
                <span className="mstep-prefill__label">{FIELD_LABELS[key]}</span>
                <span className="mstep-prefill__value">{value}</span>
              </div>
              <button
                type="button"
                className="mstep-prefill__edit"
                onClick={() => onEditField(getStepIndex(key))}
              >
                Edit
              </button>
            </motion.div>
          ))}

          {brief && (
            <motion.div
              className="mstep-prefill__field mstep-prefill__field--brief"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + fields.length * 0.1, ease: EASE }}
            >
              <div className="mstep-prefill__field-content">
                <span className="mstep-prefill__label">Your search</span>
                <span className="mstep-prefill__value mstep-prefill__value--brief">{brief}</span>
              </div>
              <button
                type="button"
                className="mstep-prefill__edit"
                onClick={() => onEditField(FIELD_STEP_MAP.brief)}
              >
                Edit
              </button>
            </motion.div>
          )}
        </div>
      )}

      <motion.div
        className="mstep-prefill__actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: isParsing && !hasExtracted ? 0.5 : 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
      >
        <button
          type="button"
          className="btn btn-primary mstep-prefill__confirm"
          onClick={onConfirm}
          disabled={isParsing && !hasExtracted}
        >
          {isParsing && !hasExtracted ? 'Extracting...' : 'Confirm & Continue'}
        </button>
      </motion.div>
    </motion.div>
  )
}

export default StepConfirmPrefill
