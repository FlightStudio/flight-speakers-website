import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import WaitlistForm from '../components/forms/WaitlistForm'
import './EnquiryPage.css'

function SpeakerWaitlistPage() {
  useEffect(() => {
    document.title = 'Join the Waitlist — FlightSpeakers'
    return () => { document.title = 'FlightSpeakers' }
  }, [])

  return (
    <div className="enquiry-page">
      {/* Floating logo */}
      <Link to="/" className="enquiry-logo" aria-label="Go to homepage">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <path d="M8 24L16 6L24 24L16 18L8 24Z" fill="currentColor"/>
        </svg>
      </Link>

      {/* Floating close */}
      <Link to="/" className="enquiry-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M14 4L4 14M4 4L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </Link>

      <main className="enquiry-main">
        <WaitlistForm />
      </main>
    </div>
  )
}

export default SpeakerWaitlistPage
