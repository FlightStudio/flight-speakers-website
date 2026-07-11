import { createMondayItem } from './monday.js'
import { mailer, commonEmailVariables } from './resend/index.js'
import { logSentEmail } from '../db/email-queries.js'

const TEMPLATE_SENDERS = {
  enquiry_received: mailer.SEND_ENQUIRY_RECEIVED,
  enquiry_processing: mailer.SEND_ENQUIRY_PROCESSING,
  exclusivity: mailer.SEND_EXCLUSIVITY,
  match_expired: mailer.SEND_MATCH_EXPIRED,
  post_event_feedback: mailer.SEND_POST_EVENT_FEEDBACK,
  pro_bono: mailer.SEND_PRO_BONO,
  reengagement: mailer.SEND_REENGAGEMENT,
  no_availability: mailer.SEND_NO_AVAILABILITY,
}

// Handles pipe-delimited date ranges: "2025-03-15|2025-03-20"
function formatEventDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('|').map(part => {
    const d = new Date(part)
    return isNaN(d.getTime()) ? part : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }).join(' – ')
}

export async function sendEnquiryEmail(enquiry, templateKey) {
  const send = TEMPLATE_SENDERS[templateKey]
  if (!send) throw new Error(`Unknown email template "${templateKey}"`)

  const baseUrl = process.env.APP_URL || 'http://localhost:3000'

  const result = await send(enquiry.email, {
    ...commonEmailVariables(),
    name: enquiry.name,
    speaker_name: enquiry.speaker_name || 'the speaker',
    event_date: formatEventDate(enquiry.event_date) || 'your event',
    feedback_url: `${baseUrl}/feedback`,
  })

  try {
    await logSentEmail({
      enquiryId: enquiry.id,
      templateKey,
      recipient: enquiry.email,
      resendId: result?.id,
    })
  } catch (err) {
    console.error(`[NOTIFY] failed to log sent email for ${enquiry.id}:`, err.message)
  }

  return result
}

export async function notifyEnquiryResponse(enquiry, responseType, { email_template } = {}) {
  console.log(`[NOTIFY] Enquiry ${enquiry.id} — ${responseType || 'no status change'}${email_template ? `, email: ${email_template}` : ''}`)

  // Create Monday.com item when enquiry is confirmed (fire-and-forget)
  if (responseType === 'confirmed') {
    createMondayItem(enquiry).catch(err => {
      console.error(`[NOTIFY] Monday.com item creation failed for ${enquiry.id}:`, err.message)
    })
  }

  if (!email_template) return { emailSent: undefined }

  try {
    await sendEnquiryEmail(enquiry, email_template)
    console.log(`[NOTIFY] Resend '${email_template}' email sent to ${enquiry.email}`)
    return { emailSent: true }
  } catch (err) {
    console.error(`[NOTIFY] Resend '${email_template}' email failed for ${enquiry.id}:`, err.message)
    return { emailSent: false }
  }
}
