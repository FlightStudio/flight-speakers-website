const MONDAY_API_URL = 'https://api.monday.com/v2'

const BUDGET_LABELS = [
  { label: '£0', max: 0 },
  { label: '£5000 or less', max: 5000 },
  { label: '£25k-40k', max: 40000 },
  { label: '£50k-70k', max: 70000 },
  { label: '£100k+', max: Infinity },
]

const REGION_MAP = [
  { keywords: ['london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'liverpool', 'cardiff', 'belfast', 'uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland'], region: 'UK' },
  { keywords: ['new york', 'los angeles', 'chicago', 'san francisco', 'miami', 'boston', 'washington', 'seattle', 'dallas', 'atlanta', 'usa', 'united states', 'america', 'us'], region: 'USA' },
  { keywords: ['dubai', 'abu dhabi', 'uae', 'united arab emirates', 'qatar', 'doha', 'saudi', 'riyadh', 'bahrain', 'kuwait', 'oman'], region: 'UAE' },
  { keywords: ['paris', 'berlin', 'amsterdam', 'barcelona', 'madrid', 'rome', 'milan', 'munich', 'vienna', 'zurich', 'geneva', 'brussels', 'copenhagen', 'stockholm', 'oslo', 'lisbon', 'dublin', 'prague', 'warsaw', 'budapest', 'europe', 'eu'], region: 'Europe' },
  { keywords: ['singapore', 'hong kong', 'tokyo', 'sydney', 'melbourne', 'mumbai', 'delhi', 'bangalore', 'shanghai', 'beijing', 'seoul', 'bangkok', 'jakarta', 'kuala lumpur', 'asia', 'australia', 'india', 'china', 'japan'], region: 'APAC' },
  { keywords: ['toronto', 'vancouver', 'montreal', 'canada', 'canadian'], region: 'Canada' },
  { keywords: ['johannesburg', 'cape town', 'lagos', 'nairobi', 'accra', 'africa', 'south africa', 'nigeria', 'kenya'], region: 'Africa' },
]

function matchBudgetLabel(budgetRange) {
  if (!budgetRange) return null

  const text = String(budgetRange).toLowerCase().replace(/,/g, '')

  // Extract numeric values
  const numbers = text.match(/[\d.]+/g)
  if (!numbers || numbers.length === 0) {
    if (text.includes('pro bono') || text.includes('free') || text.includes('voluntary')) return '£0'
    return null
  }

  // Use the highest number mentioned as the budget indicator
  const maxVal = Math.max(...numbers.map(Number))

  for (const { label, max } of BUDGET_LABELS) {
    if (maxVal <= max) return label
  }
  return '£100k+'
}

function detectRegion(location) {
  if (!location) return null
  const lower = location.toLowerCase()

  for (const { keywords, region } of REGION_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return region
  }

  return null
}

function parseFirstDate(eventDate) {
  if (!eventDate) return null

  // Try to find a date pattern like YYYY-MM-DD, DD/MM/YYYY, etc.
  const isoMatch = eventDate.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmy = eventDate.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }

  // Try parsing with Date constructor as last resort
  const parsed = new Date(eventDate)
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

function formatUpdateNotes(enquiry) {
  const client = [enquiry.name, enquiry.organization].filter(Boolean).join(', ') || ''
  const fee = enquiry.budget_range || ''
  const eventDate = enquiry.event_date || ''
  const location = enquiry.event_location || ''
  const audience = enquiry.audience_size || ''
  const brief = enquiry.brief || ''

  return [
    `*Client:* ${client}`,
    '',
    `*Event Synopsis & Event Type (Internal/External):* ${brief}`,
    '',
    '*Website/Social links:*',
    '',
    `*Fee: (This should be net fee)* ${fee}`,
    '',
    '*Deliverables: E.g. Moderated fireside chat (45mins fireside chat + 15 mins Q&A)*',
    '',
    `*Date of the event:* ${eventDate}`,
    '',
    `*Location of the event:* ${location}`,
    '',
    '*Topic:*',
    '',
    `*Audience size:* ${audience}`,
    '',
    '*Previous Speakers:*',
  ].join('\n')
}

function buildColumnValues(enquiry) {
  const cols = {}

  // Client/Organisation name
  if (enquiry.organization) {
    cols.short_text = enquiry.organization
  }

  // Contact name
  if (enquiry.name) {
    cols.short_text63 = enquiry.name
  }

  // Email
  if (enquiry.email) {
    cols.email = { email: enquiry.email, text: enquiry.email }
  }

  // Phone
  if (enquiry.phone) {
    cols.phone = { phone: enquiry.phone, countryShortName: '' }
  }

  // Is this paid?
  if (enquiry.engagement_type) {
    const isPaid = enquiry.engagement_type.toLowerCase().includes('paid') ||
                   enquiry.engagement_type.toLowerCase().includes('commercial')
    cols.single_select = { label: isPaid ? 'Yes' : 'No' }
  }

  // Speaker budget
  const budgetLabel = matchBudgetLabel(enquiry.budget_range)
  if (budgetLabel) {
    cols.single_select78 = { label: budgetLabel }
  }

  // Event date (text)
  if (enquiry.event_date) {
    cols.short_text5 = String(enquiry.event_date)
  }

  // Event date (date)
  const parsedDate = parseFirstDate(enquiry.event_date)
  if (parsedDate) {
    cols.dup__of_event_date_9 = { date: parsedDate }
  }

  // Event location (region)
  const region = detectRegion(enquiry.event_location)
  if (region) {
    cols.single_select2 = { label: region }
  }

  // Event location (text)
  if (enquiry.event_location) {
    cols.short_text7 = enquiry.event_location
  }

  // Event info (brief truncated)
  if (enquiry.brief) {
    cols.short_text1 = enquiry.brief.substring(0, 500)
  }

  // Audience size
  if (enquiry.audience_size) {
    cols.short_text01 = String(enquiry.audience_size)
  }

  // Date of submission
  if (enquiry.created_at) {
    const d = new Date(enquiry.created_at)
    if (!isNaN(d.getTime())) {
      cols.date4 = { date: d.toISOString().split('T')[0] }
    }
  }

  return cols
}

export async function createMondayItem(enquiry) {
  const token = process.env.MONDAY_API_TOKEN
  const boardId = process.env.MONDAY_BOARD_ID || '1153323847'

  if (!token) {
    console.log('[MONDAY] No MONDAY_API_TOKEN set, skipping')
    return null
  }

  const itemName = [enquiry.name, enquiry.organization].filter(Boolean).join(' — ') || `Enquiry #${enquiry.id}`
  const columnValues = buildColumnValues(enquiry)

  const query = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) {
      id
      name
    }
  }`

  const variables = {
    boardId: String(boardId),
    groupId: 'group_mkvnqw22',
    itemName: itemName,
    columnValues: JSON.stringify(columnValues),
  }

  try {
    const res = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ query, variables }),
    })

    const data = await res.json()

    if (data.errors && data.errors.length > 0) {
      console.error('[MONDAY] GraphQL errors:', JSON.stringify(data.errors))
      return null
    }

    const item = data.data?.create_item
    console.log(`[MONDAY] Created item "${item?.name}" (ID: ${item?.id}) on board ${boardId}`)

    // Post the structured brief as an update (comment) on the item
    if (item?.id) {
      const updateBody = formatUpdateNotes(enquiry)
      const updateQuery = `mutation ($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) { id }
      }`
      try {
        await fetch(MONDAY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ query: updateQuery, variables: { itemId: String(item.id), body: updateBody } }),
        })
        console.log(`[MONDAY] Posted update on item ${item.id}`)
      } catch (err) {
        console.error('[MONDAY] Failed to post update:', err.message)
      }
    }

    return item
  } catch (err) {
    console.error('[MONDAY] Failed to create item:', err.message)
    return null
  }
}
