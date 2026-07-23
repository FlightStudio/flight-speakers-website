import { useState, useEffect } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import SpeakerBrief from './SpeakerBrief'
import { fadeImageBottom } from './fadeImageBottom'
import { bustCache } from './bustCache'

/*
  Dev-only live preview for the SpeakerBrief PDF.

  Renders the exact same <SpeakerBrief /> document that production generates,
  but inside react-pdf's <PDFViewer> so it displays in the browser and
  hot-reloads on every save. No enquiry flow, no download loop — edit
  SpeakerBrief.jsx, hit save, and the PDF re-renders instantly.

  Mounted at /speaker-brief (dev builds only — see App.jsx).

  The left panel lets you tweak the content live so you can stress-test the
  layout (long names, overflowing bios, 1 vs 4 topics, missing photo, etc.)
  without touching the component.
*/

const SAMPLE = {
  name: 'Steven Bartlett',
  headline: 'Founder & CEO, FlightStory | Host of The Diary of a CEO',
  about:
    'Steven Bartlett is one of the most compelling voices of his generation, ' +
    'combining commercial insight with rare emotional honesty. He founded his ' +
    'first company at 21 and built it into a multi-billion-dollar business.',
  // headline:
  //   'Founder of FlightStory and thirdweb. Host of Europe’s #1 podcast, ' +
  //   'The Diary of a CEO. Sunday Times bestselling author. Youngest ever ' +
  //   'investor on Dragons’ Den.',
  topics: ['Leadership', 'Entrepreneurship', 'Mental Health', 'Ambition'],
  // Served from /public by the vite dev server.
  photo: 'https://storage.googleapis.com/steven-warehouse-dev-flight-speakers-photos/speakers/staged/fb26038bc9cfe64c-nobg.png',
}

const SAMPLE_TAGS = ['Keynote', 'Fireside Chat', 'Moderator']
const SAMPLE_CONTACT = { name: 'Contact Us', email: 'contact@flightspeakers.ai' }

// Additional speakers rendered as cards on page 2+ (shape: name, headline, bio,
// topics, photo, videoUrl, reasoning, matchScore). Card photos are objectFit:
// cover and go straight to <Image>, so a local /public asset avoids CORS/cache
// concerns. Deliberately mixed — some with photo/video/reasoning, some without —
// to exercise every branch of <SpeakerCard>.
const CARD_PHOTO = '/images/speakers/steven-bartlett.jpg'

const SAMPLE_SELECTED = [
  {
    name: 'Simon Sinek',
    headline: 'Optimist & bestselling author of "Start With Why"',
    bio: 'Simon Sinek is an unshakable optimist who teaches leaders and organisations how to inspire people. His TED talk on the "Golden Circle" is one of the most watched of all time.',
    topics: ['Leadership', 'Purpose', 'Culture', 'Teams'],
    photo: CARD_PHOTO,
    videoUrl: 'https://www.youtube.com/watch?v=u4ZoJKF_VuA',
  },
  {
    name: 'Brené Brown',
    headline: 'Researcher & storyteller on courage and vulnerability',
    bio: 'Brené Brown has spent two decades studying courage, vulnerability, shame and empathy, and is the author of six #1 New York Times bestsellers.',
    topics: ['Vulnerability', 'Courage', 'Leadership'],
    photo: CARD_PHOTO,
    reasoning: 'Her research-backed take on vulnerable leadership speaks directly to your brief on building trust in hybrid teams.',
    matchScore: 94,
  },
]

const SAMPLE_AI_RECS = [
  {
    name: 'Adam Grant',
    headline: 'Organisational psychologist | Wharton’s top-rated professor',
    bio: 'Adam Grant is an expert on how we find motivation and meaning, and how to lead more generous and creative lives.',
    topics: ['Motivation', 'Original Thinking', 'Culture'],
    photo: CARD_PHOTO,
    videoUrl: 'https://www.youtube.com/watch?v=fxbCHn6gE3U',
    reasoning: 'Strong fit for your innovation-culture theme; his "givers vs takers" framework maps onto your collaboration goals.',
    matchScore: 89,
  },
  {
    // no photo / video / reasoning — previews the minimal card layout
    name: 'Mel Robbins',
    headline: 'Motivational speaker & author of "The 5 Second Rule"',
    bio: 'Mel Robbins is one of the most booked speakers in the world, known for practical, science-backed tools for change.',
    topics: ['Motivation', 'Change', 'Confidence'],
  },
]

const panel = {
  wrap: { width: 320, flexShrink: 0, height: '100vh', overflowY: 'auto', padding: 20, background: '#141414', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' },
  h: { fontSize: 13, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 4px' },
  note: { fontSize: 12, lineHeight: 1.5, color: '#737373', margin: '0 0 20px' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#a3a3a3', margin: '14px 0 4px' },
  input: { width: '100%', boxSizing: 'border-box', background: '#0a0a0a', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13, padding: '8px 10px', fontFamily: 'inherit' },
  textarea: { minHeight: 70, resize: 'vertical', lineHeight: 1.4 },
  row: { display: 'flex', gap: 8, marginTop: 14 },
  btn: { flex: 1, background: '#262626', border: '1px solid #333', borderRadius: 6, color: '#e5e5e5', fontSize: 12, padding: '8px', cursor: 'pointer' },
}

export default function SpeakerBriefPreview() {
  const [speaker, setSpeaker] = useState(SAMPLE)
  const [topicsText, setTopicsText] = useState(SAMPLE.topics.join('\n'))
  const [showMore, setShowMore] = useState(true) // additional-speakers pages

  const set = (key) => (e) => setSpeaker((s) => ({ ...s, [key]: e.target.value }))

  const topics = topicsText.split('\n').map((t) => t.trim()).filter(Boolean)

  // Bake the bottom fade into the photo (react-pdf can't alpha-mask images).
  // Recomputes whenever the photo URL changes; falls back to the raw URL while
  // the canvas work is in flight or if it fails.
  const rawPhoto = bustCache(speaker.photo)
  const [fadedPhoto, setFadedPhoto] = useState(rawPhoto)
  useEffect(() => {
    let alive = true
    fadeImageBottom(rawPhoto, { fadeFraction: 0.09 }).then((url) => {
      if (alive) setFadedPhoto(url)
    })
    return () => { alive = false }
  }, [rawPhoto])

  const doc = (
    <SpeakerBrief
      speaker={{ ...speaker, topics, photo: fadedPhoto }}
      tags={SAMPLE_TAGS}
      contact={SAMPLE_CONTACT}
      selectedSpeakers={showMore ? SAMPLE_SELECTED : []}
      aiRecommendations={showMore ? SAMPLE_AI_RECS : []}
    />
  )

  const reset = () => { setSpeaker(SAMPLE); setTopicsText(SAMPLE.topics.join('\n')) }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a' }}>
      <div style={panel.wrap}>
        <p style={panel.h}>Brief preview</p>
        <p style={panel.note}>
          Dev-only. Edit SpeakerBrief.jsx and save — the PDF on the right
          re-renders instantly. Tweak the fields below to stress-test the layout.
        </p>

        <label style={panel.label}>Name</label>
        <input style={panel.input} value={speaker.name} onChange={set('name')} />

        <label style={panel.label}>Headline</label>
        <textarea style={{ ...panel.input, ...panel.textarea }} value={speaker.headline} onChange={set('headline')} />

        <label style={panel.label}>About</label>
        <textarea style={{ ...panel.input, ...panel.textarea }} value={speaker.about} onChange={set('about')} />

        <label style={panel.label}>Achievements</label>
        <textarea style={{ ...panel.input, ...panel.textarea }} value={speaker.headline} onChange={set('headline')} />

        <label style={panel.label}>Topics (one per line)</label>
        <textarea style={{ ...panel.input, ...panel.textarea }} value={topicsText} onChange={(e) => setTopicsText(e.target.value)} />

        <label style={panel.label}>Photo URL</label>
        <input style={panel.input} value={speaker.photo || ''} onChange={set('photo')} placeholder="(none)" />

        <div style={panel.row}>
          <button style={panel.btn} onClick={reset}>Reset</button>
          <button style={panel.btn} onClick={() => setSpeaker((s) => ({ ...s, photo: '' }))}>No photo</button>
        </div>
        <div style={panel.row}>
          <button style={panel.btn} onClick={() => setShowMore((v) => !v)}>
            {showMore ? 'Hide extra speakers (pg 2)' : 'Show extra speakers (pg 2)'}
          </button>
        </div>
      </div>

      <PDFViewer style={{ flex: 1, border: 'none', height: '100vh' }} showToolbar>
        {doc}
      </PDFViewer>
    </div>
  )
}
