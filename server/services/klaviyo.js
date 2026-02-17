// Klaviyo API service — profiles, events, and list subscriptions
// Docs: https://developers.klaviyo.com/en/reference/api-overview

const BASE_URL = 'https://a.klaviyo.com'
const REVISION = '2024-10-15'

function getHeaders() {
  return {
    'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
    'Content-Type': 'application/json',
    'revision': REVISION,
  }
}

async function klaviyoRequest(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Klaviyo ${endpoint} failed (${res.status}): ${text}`)
  }

  // 202/204 responses may have no body
  if (res.status === 204 || res.status === 202) return null
  return res.json()
}

// Create or update a profile (upserts by email)
export async function createOrUpdateProfile({ email, name, organization, properties = {} }) {
  const [firstName, ...rest] = (name || '').split(' ')
  const lastName = rest.join(' ')

  return klaviyoRequest('/api/profile-import/', {
    data: {
      type: 'profile',
      attributes: {
        email,
        first_name: firstName,
        last_name: lastName,
        organization,
        properties,
      },
    },
  })
}

// Subscribe a profile to a list
export async function subscribeToList(email, listId) {
  if (!listId) {
    console.warn('[KLAVIYO] No list ID provided, skipping subscription')
    return null
  }

  return klaviyoRequest('/api/profile-subscription-bulk-create-jobs/', {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        profiles: {
          data: [{ type: 'profile', attributes: { email, subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } }],
        },
      },
      relationships: {
        list: { data: { type: 'list', id: listId } },
      },
    },
  })
}

// Track an event (triggers Flows)
export async function trackEvent(eventName, email, properties = {}) {
  return klaviyoRequest('/api/events/', {
    data: {
      type: 'event',
      attributes: {
        metric: { data: { type: 'metric', attributes: { name: eventName } } },
        profile: { data: { type: 'profile', attributes: { email } } },
        properties,
      },
    },
  })
}
