// Notification service — placeholder stubs for future integrations
// Wire these into enquiry status updates when ready

export async function notifyEnquiryResponse(enquiry, responseType, message) {
  console.log(`[NOTIFY] Enquiry ${enquiry.id} — ${responseType}`)
  if (message) console.log(`[NOTIFY] Message: ${message}`)
  // Future: send email via nodemailer / SendGrid / etc.
  return true
}

export async function notifyKlaviyo(email, listName, data = {}) {
  console.log(`[KLAVIYO] Add ${email} to list "${listName}"`, data)
  // Future: POST to Klaviyo API with process.env.KLAVIYO_API_KEY
  return true
}

export async function notifyMonday(enquiry) {
  console.log(`[MONDAY] Create item for enquiry ${enquiry.id}`)
  // Future: POST to Monday.com API with process.env.MONDAY_API_KEY
  return true
}
