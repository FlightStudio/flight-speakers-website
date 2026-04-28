// Maps a waitlist entry into the SpeakerForm shape so the portal can pre-fill.
// Some waitlist fields are deliberately NOT mapped — they belong on the
// application record only (phone, why_flightspeakers, representation_status,
// fee_bracket — bracket is too imprecise for the speaker's exact feeMin).
export function mapWaitlistToSpeakerPrefill(waitlist) {
  const socialProfiles = {
    instagram: extractInstagramHandle(waitlist.instagram),
    x: '',
    linkedin: extractHandleFromUrl(waitlist.linkedin),
    youtube: '',
    tiktok: '',
  }

  // Build a starter bio from speaks_about + notable_engagements. Speaker
  // should rewrite this on the portal — it's a placeholder, not final.
  const bioParts = []
  if (waitlist.speaks_about?.trim()) bioParts.push(waitlist.speaks_about.trim())
  if (waitlist.notable_engagements?.trim()) {
    bioParts.push(`Notable engagements: ${waitlist.notable_engagements.trim()}`)
  }

  return {
    name: waitlist.full_name,
    headline: waitlist.title_company || '',
    photo: '',           // speaker uploads via portal
    bio: bioParts.join('\n\n'),
    topics: waitlist.topics || [],
    audiences: [],
    keynotes: [],
    speakingFormat: '',
    videoUrl: waitlist.showreel || '',
    feeMin: null,        // speaker enters exact fee on portal
    gender: '',
    ethnicity: '',
    nationality: '',
    location: waitlist.based_in || '',
    socialProfiles,
  }
}

function extractInstagramHandle(input) {
  if (!input) return ''
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/instagram\.com\/([^/?#]+)/i)
  if (urlMatch) return '@' + urlMatch[1]
  return trimmed.startsWith('@') ? trimmed : '@' + trimmed
}

function extractHandleFromUrl(input) {
  if (!input) return ''
  const trimmed = input.trim()
  const m = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i)
  if (m) return m[1]
  return trimmed
}
