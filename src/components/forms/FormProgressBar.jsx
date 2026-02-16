import { motion, AnimatePresence } from 'framer-motion'
import { TOTAL_STEPS } from '../../hooks/useMultiStepForm'
import { EASE } from '../../constants/animation'

const MAX_AVATARS = 5

function FormProgressBar({ currentStep, speaker, speakers = [] }) {
  // Build deduplicated speakers list: primary + additional
  const allSpeakers = []
  const seenIds = new Set()
  if (speaker) {
    allSpeakers.push(speaker)
    seenIds.add(speaker.id)
  }
  for (const s of speakers) {
    if (!seenIds.has(s.id)) {
      allSpeakers.push(s)
      seenIds.add(s.id)
    }
  }

  const visibleSpeakers = allSpeakers.slice(0, MAX_AVATARS)
  const overflow = allSpeakers.length - MAX_AVATARS

  return (
    <div
      className="mstep-progress"
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
    >
      {visibleSpeakers.length > 0 && (
        <div className={`mstep-progress__avatars${visibleSpeakers.length > 1 ? ' mstep-progress__avatars--stacked' : ''}`}>
          <AnimatePresence initial={false}>
            {visibleSpeakers.map((s, i) => (
              <motion.img
                key={s.id}
                src={s.photo}
                alt={s.name}
                className="mstep-progress__avatar"
                style={visibleSpeakers.length > 1 ? { zIndex: visibleSpeakers.length - i } : undefined}
                initial={{ opacity: 0, scale: 0.5, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {overflow > 0 && (
              <motion.span
                key="overflow"
                className="mstep-progress__avatar-overflow"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                +{overflow}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}
      <div className="mstep-progress__dots">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <motion.span
            key={i}
            className={`mstep-progress__dot${i <= currentStep ? ' mstep-progress__dot--active' : ''}`}
            initial={false}
            animate={{ scale: i === currentStep ? 1.3 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

export default FormProgressBar
