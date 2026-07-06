// Shared footer variables required by every Resend template
export function commonEmailVariables() {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000'
  return {
    company_address: 'FLIGHTSTORY, 73 Cornhill, London, EC3V 3QQ',
    contact_email: 'contact@flightspeakers.ai',
    current_year: new Date().getFullYear(),
    preferences_url: `${baseUrl}/preferences`,
    unsubscribe_url: `${baseUrl}/unsubscribe`,
  }
}