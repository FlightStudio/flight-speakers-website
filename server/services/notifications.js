import { createMondayItem } from './monday.js'
import { mailer } from './resend/index.js'

export async function notifyEnquiryResponse(enquiry, responseType, { response_message, rejection_reason } = {}) {
  console.log(`[NOTIFY] Enquiry ${enquiry.id} — ${responseType}`)

  // Create Monday.com item when enquiry is accepted (fire-and-forget)
  if (responseType === 'accepted') {
    createMondayItem(enquiry).catch(err => {
      console.error(`[NOTIFY] Monday.com item creation failed for ${enquiry.id}:`, err.message)
    })
  }

  try {
    await mailer.SEND_TEST_EMAIL(enquiry.email, {
      name: enquiry.name
    })
    // todo
    // if (responseType === 'accepted') {
    //   await mailer.sendEnquiryAccepted(enquiry.email, {
    //     name: enquiry.name,
    //     organization: enquiry.organization || '',
    //     speaker_name: enquiry.speaker_name || '',
    //     event_date: enquiry.event_date || '',
    //     event_location: enquiry.event_location || '',
    //     response_message: response_message || '',
    //   });
    // } else if (responseType === 'rejected') {
    //   await mailer.sendEnquiryRejected(enquiry.email, {
    //     name: enquiry.name,
    //     speaker_name: enquiry.speaker_name || '',
    //     rejection_reason: rejection_reason || '',
    //   });
    // } else if (responseType === 'responded') {
    //   await mailer.sendEnquiryRejected(enquiry.email, {
    //     name: enquiry.name,
    //     speaker_name: enquiry.speaker_name || '',
    //     rejection_reason: rejection_reason || '',
    //   });
    // } else {
    //   console.error(`[NOTIFY] Unknown responseType "${responseType}" for ${enquiry.id}, no email sent`)
    //   return false
    // }
    console.log(`[NOTIFY] Resend '${responseType}' email sent for ${enquiry.email}`)
  } catch (err) {
    console.error(`[NOTIFY] Resend email send failed for ${enquiry.id}:`, err.message)
  }

  return true
}