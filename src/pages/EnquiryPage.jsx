import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MultiStepEnquiryForm from '../components/forms/MultiStepEnquiryForm'
import { getCachedSpeaker } from '../utils/prefetch'
import './EnquiryPage.css'

function EnquiryPage() {
  const { speakerId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const brief = searchParams.get('brief') || ''
  const preSelectedSpeakers = location.state?.selectedSpeakers || []
  const backTo = brief ? `/search?q=${encodeURIComponent(brief)}` : '/'

  const [speaker, setSpeaker] = useState(() => {
    if (location.state?.speaker) return location.state.speaker
    // If no explicit speakerId but we have pre-selected speakers, use first as primary
    if (!speakerId && preSelectedSpeakers.length > 0) return preSelectedSpeakers[0]
    return null
  })

  useEffect(() => {
    if (!speakerId || speaker) return

    async function loadSpeaker() {
      const cached = await getCachedSpeaker(speakerId)
      if (cached) {
        setSpeaker(cached)
        return
      }

      try {
        const res = await fetch(`/api/speakers/${encodeURIComponent(speakerId)}`)
        const data = await res.json()
        if (data.success) setSpeaker(data.speaker)
      } catch (err) {
        console.error('Failed to load speaker:', err)
      }
    }

    loadSpeaker()
  }, [speakerId, speaker])

  return (
    <div className="enquiry-page">
      {/* Floating logo — no header feel */}
      <Link to={backTo} className="enquiry-logo" aria-label="Go back">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <path d="M8 24L16 6L24 24L16 18L8 24Z" fill="currentColor"/>
        </svg>
      </Link>

      {/* Floating close button */}
      <Link to={backTo} className="enquiry-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M14 4L4 14M4 4L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </Link>

      {/* Full-screen centered form */}
      <main className="enquiry-main">
        <MultiStepEnquiryForm speaker={speaker} prefillBrief={brief} preSelectedSpeakers={preSelectedSpeakers} />
      </main>
    </div>
  )
}

export default EnquiryPage
