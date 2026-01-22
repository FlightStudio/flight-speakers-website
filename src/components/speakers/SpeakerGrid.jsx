import SpeakerCard from './SpeakerCard'
import './SpeakerGrid.css'

function SpeakerGrid({ speakers, showReasoning = false, reasonings = {} }) {
  if (!speakers || speakers.length === 0) {
    return (
      <div className="speaker-grid__empty">
        <p>No speakers found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="speaker-grid">
      {speakers.map((speaker) => (
        <SpeakerCard
          key={speaker.id}
          speaker={speaker}
          showReasoning={showReasoning}
          reasoning={reasonings[speaker.id]}
        />
      ))}
    </div>
  )
}

export default SpeakerGrid
