export function buildSpeakerText(speaker) {
  const parts = [
    speaker.name,
    speaker.headline,
    speaker.bio,
  ]

  if (speaker.topics && speaker.topics.length > 0) {
    parts.push(`Topics: ${speaker.topics.join(', ')}`)
  }

  if (speaker.keynotes && speaker.keynotes.length > 0) {
    parts.push(`Keynotes: ${speaker.keynotes.join(', ')}`)
  }

  if (speaker.audiences && speaker.audiences.length > 0) {
    parts.push(`Audiences: ${speaker.audiences.join(', ')}`)
  }

  if (speaker.gender)
    parts.push(`Gender: ${speaker.gender}`)
  if (speaker.ethnicity)
    parts.push(`Ethnicity: ${speaker.ethnicity}`)
  if (speaker.nationality)
    parts.push(`Nationality: ${speaker.nationality}`)
  if (speaker.location)
    parts.push(`Location: ${speaker.location}`)

  if (speaker.boostNotes && speaker.boostNotes.trim()) {
    parts.push(`Internal notes: ${speaker.boostNotes.trim()}`)
  }

  return parts.filter(Boolean).join('\n')
}
