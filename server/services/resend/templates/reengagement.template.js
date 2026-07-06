import { getClient } from "../resendClient.js";

export async function sendReengagementEmail(
    toEmail,
    { // variables
        company_address,
        contact_email,
        current_year,
        name,
        preferences_url,
        unsubscribe_url,
    }
) {
  const { data, error } = await getClient().emails.send({
    to: toEmail,
    template: {
      id: 're-engagement',
      variables: {
        company_address,
        contact_email,
        current_year,
        name,
        preferences_url,
        unsubscribe_url,
      },
    },
  })

  if (error) {
    console.error('[RESEND] sendReengagementEmail failed:', error.message || error)
    throw new Error(`Resend send failed: ${error.message || JSON.stringify(error)}`)
  }

  return data
}
