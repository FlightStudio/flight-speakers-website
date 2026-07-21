import "./AnalyzingOverlay.css";

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { EASE } from '../../../../constants/animation'
import { analyzingMessages, analyzingMessagesDelay, ORB_LAYERS } from './config'

import whiteSpotlight from '../../../../assets/orb/white-spotlight2.png'

const randomN = (arr, n) => arr.sort(() => Math.random() - 0.5).slice(0, n);

function AnalyzingOverlay({ query }) {
  const orbs = useMemo(() => randomN(ORB_LAYERS, 2), []);

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
        <motion.div
          className="analyzing-orb"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.5, 1] }}
          transition={{
            opacity: { duration: 1, ease: EASE },
            scale: {
              type: 'tween',
              duration: 60,
              repeat: Infinity,
              ease: 'easeInOut'
            },
          }}
        >
          {orbs.map((layer, i) => (
            <motion.img
              key={i}
              alt=""
              className="analyzing-orb__layer"
              animate={layer.animate}
              transition={layer.transition}
              draggable={false}
              style={{
                backgroundColor: layer.color,
                WebkitMaskImage: `url(${whiteSpotlight})`,
                maskImage: `url(${whiteSpotlight})`,
              }}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.h2
            key={messageIndex}
            className="analyzing-overlay__title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
          >{analyzingMessages[messageIndex]}</motion.h2>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default AnalyzingOverlay;