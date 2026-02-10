import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import EnquiryForm from '../components/forms/EnquiryForm'
import './EnquiryPage.css'

function EnquiryPage() {
  const { speakerId } = useParams()
  const [searchParams] = useSearchParams()
  const brief = searchParams.get('brief') || ''

  const [speaker, setSpeaker] = useState(null)

  useEffect(() => {
    if (!speakerId) return

    fetch(`/api/speakers/${encodeURIComponent(speakerId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setSpeaker(data.speaker)
      })
      .catch(err => console.error('Failed to load speaker:', err))
  }, [speakerId])

  return (
    <div className="enquiry-page">
      <section className="enquiry-header">
        <div className="container">
          <h1 className="enquiry-header__title">
            {speaker ? `Enquire About ${speaker.name}` : 'Submit Your Brief'}
          </h1>
          <p className="enquiry-header__subtitle">
            {speaker
              ? `Tell us about your event and we'll check ${speaker.name.split(' ')[0]}'s availability.`
              : 'Share your event details and we\'ll match you with the perfect speaker.'}
          </p>
        </div>
      </section>

      <section className="section enquiry-form-section">
        <div className="container">
          <div className="enquiry-form-wrapper">
            <EnquiryForm speaker={speaker} prefillBrief={brief} />
          </div>

          <aside className="enquiry-sidebar">
            <div className="sidebar-info-card">
              <div className="sidebar-info-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Fast Response</h3>
              <p>We respond to all enquiries within 24 hours with availability and recommendations.</p>
            </div>

            <div className="sidebar-info-card">
              <div className="sidebar-info-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Curated Talent</h3>
              <p>Every speaker in our roster is personally vetted for expertise, delivery, and reliability.</p>
            </div>

            <div className="sidebar-info-card">
              <div className="sidebar-info-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>End-to-End Support</h3>
              <p>From briefing to billing, we handle all logistics so you can focus on your event.</p>
            </div>

            <div className="sidebar-contact">
              <p>Prefer to chat?</p>
              <a href="mailto:speakers@flightstory.com">
                speakers@flightstory.com
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default EnquiryPage
