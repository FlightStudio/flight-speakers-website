import { motion } from 'framer-motion'
import SpeakerCard from './SpeakerCard'
import './SpeakerGrid.css'

function SpeakerGrid({ speakers, showReasoning = false, reasonings = {}, scores = {}, searchBrief = '', selectable = false, selectedIds = new Set(), onToggleSelect }) {
  if (!speakers || speakers.length === 0) {
    return (
      <motion.div
        className="speaker-grid__empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="speaker-grid__empty-icon">✦</span>
        <p>No speakers found matching your criteria.</p>
      </motion.div>
    )
  }

  return (
    <div className="speaker-grid">
      {speakers.map((speaker, index) => (
        <SpeakerCard
          key={speaker.id}
          speaker={speaker}
          showReasoning={showReasoning}
          reasoning={reasonings[speaker.id]}
          matchScore={scores[speaker.id]}
          index={index}
          searchBrief={searchBrief}
          selectable={selectable}
          isSelected={selectedIds.has?.(speaker.id) || false}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}

export default SpeakerGrid
