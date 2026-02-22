import { trackEvent } from './klaviyo.js'
import { createMondayItem } from './monday.js'

export async function notifyEnquiryResponse(enquiry, responseType, { response_message, rejection_reason, email_subject } = {}) {
  console.log(`[NOTIFY] Enquiry ${enquiry.id} — ${responseType}`)

  // Create Monday.com item when enquiry is accepted
  if (responseType === 'accepted') {
    createMondayItem(enquiry).catch(err => {
      console.error(`[NOTIFY] Monday.com item creation failed for ${enquiry.id}:`, err.message)
    })
  }

  // Skip Klaviyo if no API key
  if (!process.env.KLAVIYO_API_KEY) {
    console.log('[NOTIFY] No KLAVIYO_API_KEY set, skipping event')
    return true
  }

  const eventProps = {
    enquiry_id: enquiry.id,
    name: enquiry.name,
    email: enquiry.email,
    organization: enquiry.organization,
    speaker_name: enquiry.speaker_name || '',
    event_date: enquiry.event_date || '',
    event_location: enquiry.event_location || '',
    email_subject: email_subject || '',
  }

  try {
    await trackEvent('Enquiry Response', enquiry.email, {
      ...eventProps,
      type: responseType,
      response_message: response_message || '',
      rejection_reason: rejection_reason || '',
    })
    console.log(`[NOTIFY] Klaviyo event 'Enquiry Response' (${responseType}) sent for ${enquiry.email}`)
  } catch (err) {
    console.error(`[NOTIFY] Klaviyo event failed for ${enquiry.id}:`, err.message)
  }

  return true
}
