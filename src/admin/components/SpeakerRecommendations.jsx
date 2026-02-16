function SpeakerCard({ speaker, featured = false, matchLabel, added, score }) {
  const imgSrc = speaker.photo || speaker.headshot_url || speaker.image_url || ''

  return (
    <div className={`speaker-rec-card${featured ? ' speaker-rec-card--featured' : ''}${added === true ? ' speaker-rec-card--added' : ''}${added === false ? ' speaker-rec-card--skipped' : ''}`}>
      <div className="speaker-rec-card__header">
        {imgSrc ? (
          <img className="speaker-rec-card__avatar" src={imgSrc} alt={speaker.name} />
        ) : (
          <div className="speaker-rec-card__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
            {speaker.name?.[0]}
          </div>
        )}
        <div>
          <div className="speaker-rec-card__name">{speaker.name}</div>
          <div className="speaker-rec-card__title">{speaker.headline || speaker.title || speaker.expertise}</div>
          {score != null && (
            <div className="speaker-rec-card__score">{score}% match</div>
          )}
        </div>
        {matchLabel && (
          <span className="speaker-rec-card__match-label">{matchLabel}</span>
        )}
        {added === true && (
          <span className="speaker-rec-card__status speaker-rec-card__status--added">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        )}
        {added === false && (
          <span className="speaker-rec-card__status speaker-rec-card__status--skipped">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        )}
      </div>
      {speaker.topics && speaker.topics.length > 0 && (
        <div className="speaker-rec-card__topics">
          {speaker.topics.slice(0, 5).map(t => (
            <span key={t} className="speaker-rec-card__topic">{t}</span>
          ))}
        </div>
      )}
      {speaker.reason && (
        <div className="speaker-rec-card__reason">{speaker.reason}</div>
      )}
    </div>
  )
}

export default function SpeakerRecommendations({ speakers }) {
  if (!speakers) return null

  const { requested, semantic = [], additional = [] } = speakers
  const additionalIds = new Set(additional.map(s => s.id))
  const hasAny = requested || semantic.length > 0

  if (!hasAny) {
    return <div className="speaker-recs__empty">No speaker recommendations available</div>
  }

  return (
    <div className="speaker-recs">
      {requested && (
        <>
          <div className="speaker-recs__section-title">Requested Speaker</div>
          <SpeakerCard speaker={requested} featured matchLabel="Requested" />
        </>
      )}

      {semantic.length > 0 && (
        <>
          <div className="speaker-recs__section-title">AI Match from Brief</div>
          {semantic.map(s => {
            const wasAdded = additionalIds.has(s.id)
            return (
              <SpeakerCard
                key={s.id}
                speaker={s}
                matchLabel="AI Match"
                score={s.score}
                added={wasAdded}
              />
            )
          })}
        </>
      )}
    </div>
  )
}
