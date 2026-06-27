import { getClient } from './resendClient.js'

export async function addResendContact(email, {
    firstName = '',
    lastName = '',
    unsubscribed = false,
    segmentId
} = {}) {
  const client = getClient();

  const { data, error } = await client.contacts.create({
    email,
    firstName,
    lastName,
    unsubscribed,
    // ...(segmentId ? {
    //     segments: [{ id: segmentId }]
    // } : {}),
  })

  if (error) {
    console.error(`[RESEND] addResendContact failed for ${email}:`, error.message || error)
    throw new Error(`Resend addResendContact failed: ${error.message || JSON.stringify(error)}`)
  }

  console.log(`[RESEND] contact created: ${email}`)
  return data;
}