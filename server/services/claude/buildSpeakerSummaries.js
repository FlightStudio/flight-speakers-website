export function buildSpeakerSummaries(speakers) {
  return speakers.map((s, i) => {
    const parts = [
      `${i + 1}. ${s.name} [id: ${s.id}]`,
      `   Headline: ${s.headline}`,
      `   Bio: ${s.bio}`,
      `   Topics: ${s.topics.join(', ')}`,
    ]
    if (s.keynotes && s.keynotes.length > 0) {
      parts.push(`   Keynotes: ${s.keynotes.join(', ')}`)
    }
    if (s.audiences && s.audiences.length > 0) {
      parts.push(`   Audiences: ${s.audiences.join(', ')}`)
    }
    if (s.feeMin != null) {
      parts.push(`   Fee Range: $${s.feeMin.toLocaleString()}+`)
    }
    if (s.gender) {
      parts.push(`   Gender: ${s.gender}`)
    }
    if (s.nationality) {
      parts.push(`   Nationality: ${s.nationality}`)
    }
    if (s.location) {
      parts.push(`   Location: ${s.location}`)
    }
    if (s.boostNotes && s.boostNotes.trim()) {
      parts.push(`   Internal Notes (for AI consideration): ${s.boostNotes.trim()}`)
    }

    return parts.join('\n')
  }).join('\n\n')
}
