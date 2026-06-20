import "./AnalyzingOverlay.css";

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { EASE } from '../../../../constants/animation'
import { analyzingMessages, analyzingMessagesDelay } from '../../config'

function AnalyzingOverlay({ query }) {
  const [messageIndex, setMessageIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => {
        if (prev >= analyzingMessages.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, analyzingMessagesDelay)
    return () => clearInterval(interval)
  }, [analyzingMessages.length])

  return (
    <motion.div
      className="analyzing-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: EASE } }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="analyzing-overlay__content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {/* Analyzing Orb */}
        <div className="analyzing-orb">
          <motion.div
            className="analyzing-orb__ring analyzing-orb__ring--outer"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="analyzing-orb__ring analyzing-orb__ring--inner"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="analyzing-orb__core"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.h2
          className="analyzing-overlay__title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
        >Analyzing your brief</motion.h2>

        {/* Analyzing messages */}
        <div className="analyzing-messages">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              className="analyzing-messages__text"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {analyzingMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
          <motion.p
            className="analyzing-messages__query"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            "{query}"
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AnalyzingOverlay;