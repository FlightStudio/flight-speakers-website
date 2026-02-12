import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEnquiry } from '../hooks/useEnquiry'
import EnquiryDetail from '../components/EnquiryDetail'
import EnquiryActions from '../components/EnquiryActions'
import SpeakerRecommendations from '../components/SpeakerRecommendations'
import BriefActions from '../../components/brief/BriefActions'

export default function AdminEnquiryDetailPage() {
  const { id } = useParams()
  const { enquiry, speakers, isLoading, updateEnquiry } = useEnquiry(id)

  // Build brief data for share actions
  const briefData = useMemo(() => {
    if (!enquiry) return null
    const primarySpeaker = speakers.requested || speakers.semantic?.[0] || null
    if (!primarySpeaker) return null

    const recs = enquiry.recommendations || []
    const primaryRec = recs.find(r => r.speakerId === primarySpeaker.id)

    const otherSpeakers = [
      ...speakers.semantic || [],
      ...speakers.related || [],
    ]
      .filter(s => s.id !== primarySpeaker.id)
      .slice(0, 5)
      .map(s => {
        const rec = recs.find(r => r.speakerId === s.id)
        return { ...s, reasoning: rec?.reasoning || s.reason, matchScore: rec?.score }
      })

    return {
      speaker: primarySpeaker,
      reasoning: primaryRec?.reasoning || primarySpeaker.reason || '',
      matchScore: primaryRec?.score ?? null,
      otherSpeakers,
      query: enquiry.brief || '',
    }
  }, [enquiry, speakers])

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" />
        Loading enquiry...
      </div>
    )
  }

  if (!enquiry) {
    return (
      <div className="admin-page">
        <Link to="/admin" className="admin-detail__back">
          &larr; Back to dashboard
        </Link>
        <div className="enquiry-list__empty">Enquiry not found</div>
      </div>
    )
  }

  return (
    <motion.div
      className="admin-detail"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="admin-detail__top-bar">
        <Link to="/admin" className="admin-detail__back">
          &larr; Back to dashboard
        </Link>
        {briefData && (
          <BriefActions
            speaker={briefData.speaker}
            reasoning={briefData.reasoning}
            matchScore={briefData.matchScore}
            otherSpeakers={briefData.otherSpeakers}
            query={briefData.query}
            variant="small"
          />
        )}
      </div>

      <div className="admin-detail__columns">
        <div className="admin-detail__left">
          <EnquiryDetail enquiry={enquiry} additionalSpeakers={speakers.additional || []} />
          <EnquiryActions enquiry={enquiry} onUpdate={updateEnquiry} />
        </div>

        <div className="admin-detail__right">
          <div className="admin-detail__right-section">
            <div className="admin-detail__right-title">Speaker Recommendations</div>
            <SpeakerRecommendations speakers={speakers} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
