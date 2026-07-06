import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEnquiry } from '../hooks/useEnquiry'
import EnquiryDetail from '../components/EnquiryDetail'
import EnquiryActions from '../components/EnquiryActions'
import SpeakerRecommendations from '../components/SpeakerRecommendations'
import { EASE } from '../../constants/animation'

export default function AdminEnquiryDetailPage() {
  const { id } = useParams()
  const { enquiry, speakers, sentEmails, isLoading, updateEnquiry } = useEnquiry(id)

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
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-detail__top-bar">
        <Link to="/admin" className="admin-detail__back">
          &larr; Back to dashboard
        </Link>
      </div>

      <div className="admin-detail__columns">
        <div className="admin-detail__left">
          <EnquiryDetail enquiry={enquiry} additionalSpeakers={speakers.additional || []} sentEmails={sentEmails} />
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
