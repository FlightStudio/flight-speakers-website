import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #e8e8e6',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#94a3b8',
  },
  headerDate: {
    fontSize: 9,
    color: '#94a3b8',
  },
  querySection: {
    backgroundColor: '#fafaf8',
    border: '1px solid #e8e8e6',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  queryLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  queryText: {
    fontSize: 9.5,
    color: '#404040',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#E85D4C',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  speakerSection: {
    marginBottom: 20,
  },
  speakerRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  speakerPhoto: {
    width: 80,
    height: 80,
    borderRadius: 10,
    objectFit: 'cover',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  speakerHeadline: {
    fontSize: 10,
    color: '#737373',
    marginBottom: 6,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  topicTag: {
    fontSize: 8,
    color: '#404040',
    backgroundColor: '#f5f5f5',
    padding: '2px 6px',
    borderRadius: 3,
  },
  bioText: {
    fontSize: 9.5,
    color: '#404040',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 16,
    color: '#1a1a1a',
    borderBottom: '1px solid #f0f0ee',
    paddingBottom: 4,
  },
  reasoningBox: {
    backgroundColor: '#fafaf8',
    border: '1px solid #e8e8e6',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  reasoningLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 9.5,
    color: '#404040',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  matchScore: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    marginTop: 4,
  },
  videoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fafaf8',
    border: '1px solid #e8e8e6',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  videoThumb: {
    width: 80,
    height: 52,
    borderRadius: 4,
    objectFit: 'cover',
  },
  videoInfo: {
    flex: 1,
  },
  videoLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  videoLink: {
    fontSize: 8,
    color: '#3b82f6',
  },
  otherSpeakersGrid: {
    marginTop: 8,
  },
  otherSpeakerCard: {
    flexDirection: 'row',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid #f0f0ee',
  },
  otherPhoto: {
    width: 36,
    height: 36,
    borderRadius: 6,
    objectFit: 'cover',
  },
  otherInfo: {
    flex: 1,
  },
  otherName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  otherHeadline: {
    fontSize: 8,
    color: '#737373',
    marginBottom: 2,
  },
  otherScore: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  otherReasoning: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e8e8e6',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
  },
})

function SpeakerCard({ s }) {
  return (
    <View style={styles.otherSpeakerCard}>
      {s.photo && (
        <Image style={styles.otherPhoto} src={s.photo} />
      )}
      <View style={styles.otherInfo}>
        <Text style={styles.otherName}>{s.name}</Text>
        <Text style={styles.otherHeadline}>{s.headline}</Text>
        {s.matchScore != null && (
          <Text style={styles.otherScore}>{s.matchScore}% match</Text>
        )}
        {s.reasoning && (
          <Text style={styles.otherReasoning}>{s.reasoning}</Text>
        )}
      </View>
    </View>
  )
}

export default function SpeakerBrief({ speaker, reasoning, matchScore, selectedSpeakers, aiRecommendations, otherSpeakers, query }) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const bioPreview = speaker.bio
    ? speaker.bio.split('\n\n').slice(0, 2).join('\n\n')
    : ''

  // Backward compat: use otherSpeakers as AI recs if new props not provided
  const resolvedSelected = selectedSpeakers || []
  const resolvedAiRecs = aiRecommendations || otherSpeakers || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Brief</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerSubtitle}>Prepared by Flight Speakers</Text>
            <Text style={styles.headerDate}>{today}</Text>
          </View>
        </View>

        {/* Original query/brief */}
        {query && (
          <View style={styles.querySection}>
            <Text style={styles.queryLabel}>Your Event Brief</Text>
            <Text style={styles.queryText}>{query}</Text>
          </View>
        )}

        {/* 1. Primary Speaker */}
        <Text style={styles.sectionLabel}>{reasoning ? 'AI Recommended Speaker' : 'Recommended Speaker'}</Text>
        <View style={styles.speakerSection}>
          <View style={styles.speakerRow}>
            {speaker.photo && (
              <Image style={styles.speakerPhoto} src={speaker.photo} />
            )}
            <View style={styles.speakerInfo}>
              <Text style={styles.speakerName}>{speaker.name}</Text>
              <Text style={styles.speakerHeadline}>{speaker.headline}</Text>
              <View style={styles.topicsRow}>
                {(speaker.topics || []).map((topic, i) => (
                  <Text key={i} style={styles.topicTag}>{topic}</Text>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.bioText}>{bioPreview}</Text>
        </View>

        {/* 2. AI Explanation */}
        {reasoning && (
          <View style={styles.reasoningBox}>
            <Text style={styles.reasoningLabel}>Why this speaker matches your brief</Text>
            <Text style={styles.reasoningText}>{reasoning}</Text>
            {matchScore != null && (
              <Text style={styles.matchScore}>{matchScore}% match</Text>
            )}
          </View>
        )}

        {/* Sizzle Reel */}
        {speaker.videoUrl && (
          <View style={styles.videoSection}>
            <Image style={styles.videoThumb} src={speaker.photo} />
            <View style={styles.videoInfo}>
              <Text style={styles.videoLabel}>Sizzle Reel</Text>
              <Link src={speaker.videoUrl} style={styles.videoLink}>
                <Text>Watch {speaker.name.split(' ')[0]}'s speaker reel</Text>
              </Link>
            </View>
          </View>
        )}

        {/* 3. Your Selected Speakers (toggled by user) */}
        {resolvedSelected.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Your Selected Speakers</Text>
            <View style={styles.otherSpeakersGrid}>
              {resolvedSelected.slice(0, 6).map((s, i) => (
                <SpeakerCard key={i} s={s} />
              ))}
            </View>
          </View>
        )}

        {/* 4. Other Recommendations */}
        {resolvedAiRecs.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{reasoning ? 'Other AI Recommendations' : 'Other Recommendations'}</Text>
            <View style={styles.otherSpeakersGrid}>
              {resolvedAiRecs.slice(0, 4).map((s, i) => (
                <SpeakerCard key={i} s={s} />
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Flight Speakers</Text>
          <Text style={styles.footerText}>Prepared by Flight Speakers | hello@flightspeakers.com</Text>
        </View>
      </Page>
    </Document>
  )
}
