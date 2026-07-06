import { getClient } from "../resendClient.js";

export async function sendExclusivityEmail(
    toEmail,
    { // variables
        company_address,
        contact_email,
        current_year,
        event_date,
        name,
        preferences_url,
        speaker_name,
        unsubscribe_url,
    }
) {
  const { data, error } = await getClient().emails.send({
    to: toEmail,
    template: {
      id: 'exclusivity',
      variables: {
        company_address,
        contact_email,
        current_year,
        event_date,
        name,
        preferences_url,
        speaker_name,
        unsubscribe_url,
      },
    },
  })

  if (error) {
    console.error('[RESEND] sendExclusivityEmail failed:', error.message || error)
    throw new Error(`Resend send failed: ${error.message || JSON.stringify(error)}`)
  }

  return data
}
