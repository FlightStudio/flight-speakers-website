import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1]

function SuccessScreen({ name, onReset }) {
  const firstName = name ? name.split(' ')[0] : ''

  return (
    <motion.div
      className="mstep-success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="mstep-success__icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <motion.circle
            cx="32"
            cy="32"
            r="30"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          <motion.path
            d="M20 32L28 40L44 24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
          />
        </svg>
      </div>

      <motion.h2
        className="mstep-success__title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
      >
        Thank you{firstName ? `, ${firstName}` : ''}!
      </motion.h2>

      <motion.p
        className="mstep-success__message"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
      >
        We've received your enquiry and will be in touch within 24 hours with availability and recommendations.
      </motion.p>

      <motion.button
        type="button"
        className="btn btn-ghost mstep-success__reset"
        onClick={onReset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1, ease: EASE }}
      >
        Submit another enquiry
      </motion.button>
    </motion.div>
  )
}

export default SuccessScreen
