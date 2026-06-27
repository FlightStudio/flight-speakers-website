import { getClient } from "../resendClient.js";

export async function sendTestEmail(
    toEmail,
    { // variables
        name
    }
) {
  const { data, error } = await getClient().emails.send({
    to: toEmail,
    template: {
      id: 'test-template',
      variables: { name },
    },
  })

  if (error) {
    console.error('[RESEND] sendTestTemplate failed:', error.message || error)
    throw new Error(`Resend send failed: ${error.message || JSON.stringify(error)}`)
  }

  return data
}