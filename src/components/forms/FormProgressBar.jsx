import { motion } from 'framer-motion'
import { TOTAL_STEPS } from '../../hooks/useMultiStepForm'

function FormProgressBar({ currentStep, speaker }) {
  return (
    <div
      className="mstep-progress"
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
    >
      {speaker && (
        <img
          src={speaker.photo}
          alt={speaker.name}
          className="mstep-progress__avatar"
        />
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
