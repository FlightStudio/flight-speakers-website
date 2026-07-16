import { useState } from 'react'
import './EnquiryForm.css'

function EnquiryForm({ speaker = null, prefillBrief = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    eventName: '',
    eventDate: '',
    eventLocation: '',
    audienceSize: '',
    budgetRange: '',
    eventType: '',
    brief: prefillBrief,
    speakerId: speaker?.id || '',
    speakerName: speaker?.name || '',
    newsletter: false,
  })

  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Thank you for your enquiry! We\'ll be in touch within 24 hours.'
        })
        setFormData({
          name: '',
          organization: '',
          email: '',
          phone: '',
          eventName: '',
          eventDate: '',
          eventLocation: '',
          audienceSize: '',
          budgetRange: '',
          eventType: '',
          brief: '',
          speakerId: '',
          speakerName: '',
          newsletter: false,
        })
      } else {
        throw new Error(data.message || 'Something went wrong')
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to submit enquiry. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const eventTypes = [
    'Conference / Summit',
    'Corporate Offsite',
    'Leadership Event',
    'Product Launch',
    'Sales Kickoff',
    'Awards / Gala',
    'Internal Training',
    'Virtual Event',
    'Other'
  ]

  const budgetRanges = [
    'Under $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    '$50,000 - $100,000',
    'Over $100,000',
    'Flexible / To be discussed'
  ]

  return (
    <form onSubmit={handleSubmit} className="enquiry-form">
      {speaker && (
        <div className="enquiry-form__speaker-context">
          <img src={speaker.photo} alt={speaker.name} className="enquiry-form__speaker-photo" />
          <div>
            <p className="enquiry-form__speaker-label">Enquiring about</p>
            <p className="enquiry-form__speaker-name">{speaker.name}</p>
          </div>
        </div>
      )}

      <div className="enquiry-form__section">
        <h3 className="enquiry-form__section-title">Your Details</h3>
        <div className="enquiry-form__row">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="organization" className="form-label">Organization *</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="enquiry-form__row">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="enquiry-form__section">
        <h3 className="enquiry-form__section-title">Event Details</h3>
        <div className="form-group">
          <label htmlFor="eventName" className="form-label">Event Name</label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Annual Leadership Summit 2026"
          />
        </div>
        <div className="enquiry-form__row">
          <div className="form-group">
            <label htmlFor="eventDate" className="form-label">Event Date</label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="eventLocation" className="form-label">Event Location</label>
            <input
              type="text"
              id="eventLocation"
              name="eventLocation"
              value={formData.eventLocation}
              onChange={handleChange}
              className="form-input"
              placeholder="City, Country or Virtual"
            />
          </div>
        </div>

        <div className="enquiry-form__row">
          <div className="form-group">
            <label htmlFor="eventType" className="form-label">Event Type</label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select event type</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="audienceSize" className="form-label">Audience Size</label>
            <input
              type="text"
              id="audienceSize"
              name="audienceSize"
              value={formData.audienceSize}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 200 attendees"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="budgetRange" className="form-label">Budget Range</label>
          <select
            id="budgetRange"
            name="budgetRange"
            value={formData.budgetRange}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select budget range</option>
            {budgetRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="enquiry-form__section">
        <h3 className="enquiry-form__section-title">Your Brief</h3>
        <div className="form-group">
          <label htmlFor="brief" className="form-label">
            Tell us about your event and what you're looking for *
          </label>
          <textarea
            id="brief"
            name="brief"
            value={formData.brief}
            onChange={handleChange}
            className="form-textarea"
            rows={5}
            placeholder="Describe your event, audience, and the type of speaker or topics you're interested in..."
            required
          />
        </div>
      </div>

      <div className="enquiry-form__footer">
        <label className="enquiry-form__checkbox">
          <input
            type="checkbox"
            name="newsletter"
            checked={formData.newsletter}
            onChange={handleChange}
          />
          <span>Keep me updated on speaker news and insights</span>
        </label>

        {status.message && (
          <div className={`enquiry-form__status enquiry-form__status--${status.type}`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg enquiry-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
        </button>

        <p className="enquiry-form__privacy">
          By submitting this form, you agree to our privacy policy. We'll never share your information.
        </p>
      </div>
    </form>
  )
}

export default EnquiryForm
