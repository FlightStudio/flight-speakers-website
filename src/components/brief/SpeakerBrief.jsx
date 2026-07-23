import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  // Font,
} from '@react-pdf/renderer'

import logo from '../../assets/logo.png'
import spotlightImage from '../../assets/yellow-spotlight.png'

/*
  Page 1  — main speaker, dark "spotlight" layout.
  Page 2+ — any additional speakers listed in rows (dark theme),
            split into "Your Selected Speakers" and "Other Recommendations".

  Usage:

  <SpeakerSpotlight
    speaker={{
      name: 'Harry Stebbings',
      headline: 'Entrepreneur, Keynote Speaker, AI Business Strategist & 6x Bestselling Author',
      about: 'Six-time bestselling author. Founder of ...',
      topics: ['Business', 'Personal Growth', 'Social Media'],
      photo: speakerCutoutPng,        // transparent cutout, bottom pre-faded via fadeImageBottom
    }}
    tags={['Keynote', 'Fireside Chat', 'Moderator']}
    selectedSpeakers={[{ name, headline, bio, topics, photo, videoUrl, reasoning, matchScore }]}
    aiRecommendations={[...same shape...]}
    contact={{ name: 'Giorgia Taylor', email: 'giorgia@flightstory.com' }}
  />

  For a closer match to the mockup's typeface, register a grotesque font and
  swap the fontFamily values below, e.g.:

  Font.register({
    family: 'Grotesque',
    fonts: [
      { src: '/fonts/Grotesque-Regular.ttf' },
      { src: '/fonts/Grotesque-Medium.ttf', fontWeight: 500 },
    ],
  })
*/

const PAGE_W = 595.28
const PAGE_H = 841.89
const PAD_X = 48

// Speaker cutout box — vertically centred on the page. Its bottom edge is faded
// to transparent before rendering (see fadeImageBottom) so the spotlight glow
// shows through; react-pdf has no native way to alpha-mask an image.
const PHOTO_LEFT = 64
const PHOTO_W = 430
const PHOTO_H = 585
const PHOTO_TOP = (PAGE_H - PHOTO_H) / 2 // centred vertically

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0a0a0a',
    fontFamily: 'Helvetica',
    color: '#ffffff',
  },
  gradientBar: {
    position: 'absolute',
    left: 0,
  },

  /* ---------- layered images ---------- */
  spotlight: {
    position: 'absolute',
    top: 270,
    left: 0,
    width: PAGE_W,
    height: 565,
  },
  speakerPhoto: {
    position: 'absolute',
    top: PHOTO_TOP,
    left: PHOTO_LEFT,
    width: PHOTO_W,
    height: PHOTO_H,
    objectFit: 'contain',
    objectPosition: 'bottom',
  },

  /* ---------- header ---------- */
  content: {
    paddingTop: 30,
    paddingHorizontal: PAD_X,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#e5e5e5',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    fontSize: 7,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#e5e5e5',
    backgroundColor: '#262626',
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },

  name: {
    marginTop: 42,
    fontSize: 52,
    lineHeight: 1.02,
    letterSpacing: -1.5,
    color: '#ffffff',
    maxWidth: 440,
  },
  headline: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.35,
    color: '#fafafa',
    maxWidth: 370,
  },

  /* ---------- about / achievements columns ---------- */
  columns: {
    flexDirection: 'row',
    gap: 26,
    marginTop: 30,
  },
  column: {
    width: 472,
  },
  columnTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  columnBody: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: '#d4d4d4',
  },

  /* ---------- key topics callout ---------- */
  keyTopics: {
    position: 'absolute',
    top: 562,
    right: PAD_X,
    width: 300,
  },
  keyTopicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyTopicsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  keyTopicsLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  keyTopicsLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  keyTopicsList: {
    marginTop: 8,
    marginLeft: 168, // aligns under the label, past dot + line
  },
  keyTopicItem: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#f5f5f5',
  },

  /* ---------- additional speakers pages ---------- */
  listPage: {
    backgroundColor: '#0a0a0a',
    fontFamily: 'Helvetica',
    color: '#ffffff',
    paddingTop: 44,
    paddingHorizontal: PAD_X,
    paddingBottom: 70, // clears the fixed footer
  },
  listEyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#e5e5e5',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    borderBottom: '1px solid #262626',
    paddingBottom: 6,
    marginBottom: 6,
    marginTop: 12,
  },
  speakerCard: {
    paddingVertical: 14,
    borderBottom: '1px solid #1c1c1c',
  },
  speakerCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  speakerCardPhoto: {
    width: 80,
    height: 80,
    borderRadius: 10,
    objectFit: 'cover',
  },
  speakerCardInfo: {
    flex: 1,
  },
  speakerCardName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  speakerCardHeadline: {
    fontSize: 9,
    color: '#a3a3a3',
    marginBottom: 5,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  topicTag: {
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#e5e5e5',
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  bioText: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: '#d4d4d4',
    marginBottom: 8,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  videoLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  videoLink: {
    fontSize: 8,
    color: '#60a5fa',
  },
  reasoningBox: {
    backgroundColor: '#141414',
    border: '1px solid #262626',
    borderRadius: 6,
    padding: 10,
  },
  reasoningText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#b5b5b5',
    fontStyle: 'italic',
  },
  matchScore: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#4ade80',
    marginTop: 4,
  },

  /* ---------- footer (both page types) ---------- */
  footer: {
    position: 'absolute',
    bottom: 26,
    left: PAD_X,
    right: PAD_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  contactName: {
    fontSize: 8,
    color: '#d4d4d4',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 8,
    color: '#d4d4d4',
  },
  logo: {
    width: 118,
    height: 22,
    objectFit: 'contain',
  },
  logoFallback: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
})

function Footer({ contact }) {
  return (
    <View style={styles.footer} fixed>
      <View>
        {contact.name ? <Text style={styles.contactName}>{contact.name}</Text> : null}
        {contact.email ? <Text style={styles.contactEmail}>{contact.email}</Text> : null}
      </View>
      {logo ? (
        <Image style={styles.logo} src={logo} />
      ) : (
        <Text style={styles.logoFallback}>Flight Speakers</Text>
      )}
    </View>
  )
}

function SpeakerCard({ s }) {
  const bio = s.bio ? s.bio.split('\n\n').slice(0, 2).join('\n\n') : ''
  return (
    <View style={styles.speakerCard} wrap={false}>
      <View style={styles.speakerCardRow}>
        {s.photo && <Image style={styles.speakerCardPhoto} src={s.photo} />}
        <View style={styles.speakerCardInfo}>
          <Text style={styles.speakerCardName}>{s.name}</Text>
          <Text style={styles.speakerCardHeadline}>{s.headline}</Text>
          {(s.topics || []).length > 0 && (
            <View style={styles.topicsRow}>
              {s.topics.slice(0, 5).map((topic, i) => (
                <Text key={i} style={styles.topicTag}>{topic}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
      {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
      {s.videoUrl && (
        <View style={styles.videoRow}>
          <Text style={styles.videoLabel}>Sizzle Reel</Text>
          <Link src={s.videoUrl} style={styles.videoLink}>
            <Text>Watch {s.name.split(' ')[0]}'s speaker reel</Text>
          </Link>
        </View>
      )}
      {(s.reasoning || s.matchScore != null) && (
        <View style={styles.reasoningBox}>
          {s.reasoning && <Text style={styles.reasoningText}>{s.reasoning}</Text>}
          {s.matchScore != null && (
            <Text style={styles.matchScore}>{s.matchScore}% match</Text>
          )}
        </View>
      )}
    </View>
  )
}

export default function SpeakerSpotlight({
  speaker,
  tags = ['Keynote', 'Fireside Chat', 'Moderator'],
  selectedSpeakers,
  aiRecommendations,
  otherSpeakers, // backward compat: treated as AI recs if new props absent
  contact = { name: 'Contact Us', email: 'contact@flightspeakers.ai' },
}) {
  const firstName = speaker.name ? speaker.name.split(' ')[0] : ''
  const resolvedSelected = selectedSpeakers || []
  const resolvedAiRecs = aiRecommendations || otherSpeakers || []
  const hasMoreSpeakers = resolvedSelected.length > 0 || resolvedAiRecs.length > 0

  return (
    <Document>
      {/* ---------- Page 1: main speaker spotlight ---------- */}
      <Page size="A4" style={styles.page}>
        {/* glow sits behind everything */}
        {spotlightImage && <Image style={styles.spotlight} src={spotlightImage} />}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>Exclusive Speaker</Text>
            <View style={styles.tagsRow}>
              {tags.map((t, i) => (
                <Text key={i} style={styles.tag}>{t}</Text>
              ))}
            </View>
          </View>

          <Text style={styles.name}>{speaker.name}</Text>
          <Text style={styles.headline}>{speaker.headline}</Text>

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.columnTitle}>About {firstName}</Text>
              <Text style={styles.columnBody}>{speaker.about}</Text>
            </View>
            {/* <View style={styles.column}>
              <Text style={styles.columnTitle}>Achievements</Text>
              <Text style={styles.columnBody}>{speaker.headline}</Text>
            </View> */}
          </View>
        </View>

        {/* speaker cutout on top of the glow, under the callout. Its bottom
            edge is faded to transparent upstream (fadeImageBottom) so the
            spotlight shows through — react-pdf can't alpha-mask images itself. */}
        {speaker.photo && <Image style={styles.speakerPhoto} src={speaker.photo} />}

        {/* key topics callout with connector line */}
        {(speaker.topics || []).length > 0 && (
          <View style={styles.keyTopics}>
            <View style={styles.keyTopicsRow}>
              <View style={styles.keyTopicsDot} />
              <View style={styles.keyTopicsLine} />
              <Text style={styles.keyTopicsLabel}>Key Topics</Text>
            </View>
            <View style={styles.keyTopicsList}>
              {speaker.topics.slice(0, 4).map((t, i) => (
                <Text key={i} style={styles.keyTopicItem}>{t}</Text>
              ))}
            </View>
          </View>
        )}

        <Footer contact={contact} />
      </Page>

      {/* ---------- Page 2+: additional speakers in rows ---------- */}
      {hasMoreSpeakers && (
        <Page size="A4" style={styles.listPage}>
          <Text style={styles.listEyebrow} fixed>More Speakers</Text>

          {resolvedSelected.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Your Selected Speakers</Text>
              {resolvedSelected.slice(0, 6).map((s, i) => (
                <SpeakerCard key={i} s={s} />
              ))}
            </View>
          )}

          {resolvedAiRecs.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Other Recommendations</Text>
              {resolvedAiRecs.slice(0, 4).map((s, i) => (
                <SpeakerCard key={i} s={s} />
              ))}
            </View>
          )}

          <Footer contact={contact} />
        </Page>
      )}
    </Document>
  )
}
