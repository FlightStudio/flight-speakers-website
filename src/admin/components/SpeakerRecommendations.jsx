function SpeakerCard({ speaker, featured = false, matchLabel }) {
  const imgSrc = speaker.photo || speaker.headshot_url || speaker.image_url || ''

  return (
    <div className={`speaker-rec-card ${featured ? 'speaker-rec-card--featured' : ''}`}>
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
        </div>
        {matchLabel && (
          <span className="speaker-rec-card__match-label">{matchLabel}</span>
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

  const { requested, related = [], semantic = [], additional = [] } = speakers
  const hasAny = requested || related.length > 0 || semantic.length > 0 || additional.length > 0

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

      {related.length > 0 && (
        <>
          <div className="speaker-recs__section-title">Similar Speakers</div>
          {related.map(s => (
            <SpeakerCard key={s.id} speaker={s} matchLabel="Related" />
          ))}
        </>
      )}

      {semantic.length > 0 && (
        <>
          <div className="speaker-recs__section-title">AI-Matched from Brief</div>
          {semantic.map(s => (
            <SpeakerCard key={s.id} speaker={s} matchLabel="AI Match" />
          ))}
        </>
      )}

      {additional.length > 0 && (
        <>
          <div className="speaker-recs__section-title">Additional Speakers Requested</div>
          {additional.map(s => (
            <SpeakerCard key={s.id} speaker={s} matchLabel="Added" />
          ))}
        </>
      )}
    </div>
  )
}
