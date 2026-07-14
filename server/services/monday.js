import { getSpeakerNamesByIds } from '../db/queries.js'

const MONDAY_API_URL = 'https://api.monday.com/v2'

// Board/column IDs pulled live from the API — see MONDAY_BOARD_MAPPING.md.
// Account `team-doac`. New website enquiries land on the LEADS board, in the
// "New Leads" group. The DEALS board (MONDAY_DEALS_BOARD_ID) is fed later in
// the pipeline, not from the website directly.
const LEADS_BOARD_ID = '5089018278'
const LEADS_NEW_LEADS_GROUP = 'topics'
const LEADS_PRO_BONO_GROUP = 'group_mm1j54qn'

const LEADS_COLUMNS = {
  contactName: 'text_mm4d6fzd',       // text — Contact Name
  email: 'emailfr7pa42d',             // email — Email
  eventDescribes: 'single_selectf7dzip7', // status — Which best describes your event?
  speakingFee: 'number9v4u9tzf',      // numbers — Speaking Fee
  feeCurrency: 'short_text02cz5ldf',  // text — Speaking Fee Currency
  idealDate: 'dateb2mzkylj',          // date — Ideal Speaking Date
  dateRange: 'date_range9ain9qt2',    // timeline — Event Date range
  audience: 'short_textphywpxvf',     // text — Audience
  synopsis: 'text',                   // text — Event Synopsis (short; full brief goes in the update)
  speakers: 'multi_selectmsmvx3gc',   // dropdown — Which Speaker… (select all)
  submittedOn: 'datekk48r20d',        // date — Date of Form Submission
}
// Team-managed columns (lead_status, Contacted?, Notes) are never set from here.
// No Phone column and the Location column needs lat/lng we don't have, so both
// go into the item update instead (gaps 1 & 2 in MONDAY_BOARD_MAPPING.md).

// A lead becomes a deal when the enquiry is confirmed. One-way only — later
// status changes never move it back to Leads.
const DEALS_BOARD_ID = '5089018284'
const DEALS_QUALIFIED_GROUP = 'topics'

const DEALS_COLUMNS = {
  eventName: 'text_mkyqfdc4',      // text — Event Name
  stage: 'deal_stage',             // status — Stage
  dealValue: 'deal_value',         // numbers — Deal Value
  speaker: 'text_mkyns55b',        // text — Speaker
  eventDate: 'date_mkyn930v',      // date — Event Date
  email: 'email_mkyqazv9',         // email — Email
  eventDescribes: 'color_mkyq5veq', // status — Which best describes your event?
}
// Owner (`deal_owner`) is team-managed; Location needs lat/lng — both skipped.

// enquiry.engagement_type → status labels on `single_selectf7dzip7`
const ENGAGEMENT_LABELS = {
  'Paid': 'Paid Speaking Event Request',
  'Pro Bono': 'Pro-Bono Event Consideration',
}

// Best-effort numeric fee from free-text budget ranges like "5000",
// "£5,000" or "£25k-40k" — uses the highest figure mentioned.
function parseBudgetNumber(budgetRange) {
  if (!budgetRange) return null
  const text = String(budgetRange).toLowerCase().replace(/,/g, '')
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(k)?/g)]
  if (matches.length === 0) return null
  const values = matches.map(m => parseFloat(m[1]) * (m[2] ? 1000 : 1))
  return Math.max(...values)
}

function parseDateString(value) {
  if (!value) return null

  const iso = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  }

  const dmy = value.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }

  const parsed = new Date(value)
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

// event_date is a string, pipe-delimited when the form sent a range:
// "2026-03-15|2026-03-20"
function parseEventDates(eventDate) {
  if (!eventDate) return { first: null, range: null }
  const parts = String(eventDate).split('|').map(p => parseDateString(p.trim())).filter(Boolean)
  if (parts.length === 0) return { first: null, range: null }
  return {
    first: parts[0],
    range: parts.length >= 2 ? { from: parts[0], to: parts[parts.length - 1] } : null,
  }
}

function parseRecommendations(recommendations) {
  if (Array.isArray(recommendations)) return recommendations
  if (typeof recommendations === 'string') {
    try { return JSON.parse(recommendations) } catch { return [] }
  }
  return []
}

// Dropdown labels for `multi_selectmsmvx3gc`: primary speaker, any additional
// speakers picked on the form, and selected recommendations. Names must match
// the Monday labels; create_labels_if_missing covers new speakers.
async function collectSpeakerLabels(enquiry) {
  const names = new Set()

  if (enquiry.speaker_name) names.add(enquiry.speaker_name)

  for (const rec of parseRecommendations(enquiry.recommendations)) {
    if (rec?.selected && rec.speakerName) names.add(rec.speakerName)
  }

  if (enquiry.additional_speaker_ids?.length) {
    try {
      const additional = await getSpeakerNamesByIds(enquiry.additional_speaker_ids)
      additional.forEach(name => names.add(name))
    } catch (err) {
      console.error('[MONDAY] Failed to resolve additional speaker names:', err.message)
    }
  }

  return [...names]
}

async function buildColumnValues(enquiry) {
  const cols = {}

  if (enquiry.name) {
    cols[LEADS_COLUMNS.contactName] = enquiry.name
  }

  if (enquiry.email) {
    cols[LEADS_COLUMNS.email] = { email: enquiry.email, text: enquiry.email }
  }

  const engagementLabel = ENGAGEMENT_LABELS[enquiry.engagement_type]
  if (engagementLabel) {
    cols[LEADS_COLUMNS.eventDescribes] = { label: engagementLabel }
  }

  const fee = parseBudgetNumber(enquiry.budget_range)
  if (fee !== null) {
    cols[LEADS_COLUMNS.speakingFee] = fee
  }

  if (enquiry.currency) {
    cols[LEADS_COLUMNS.feeCurrency] = enquiry.currency
  }

  const { first, range } = parseEventDates(enquiry.event_date)
  if (first) {
    cols[LEADS_COLUMNS.idealDate] = { date: first }
  }
  if (range) {
    cols[LEADS_COLUMNS.dateRange] = range
  }

  if (enquiry.audience_size) {
    cols[LEADS_COLUMNS.audience] = String(enquiry.audience_size)
  }

  if (enquiry.brief) {
    cols[LEADS_COLUMNS.synopsis] = enquiry.brief.substring(0, 2000)
  }

  const speakerLabels = await collectSpeakerLabels(enquiry)
  if (speakerLabels.length > 0) {
    cols[LEADS_COLUMNS.speakers] = { labels: speakerLabels }
  }

  const submitted = enquiry.created_at ? new Date(enquiry.created_at) : new Date()
  if (!isNaN(submitted.getTime())) {
    cols[LEADS_COLUMNS.submittedOn] = { date: submitted.toISOString().split('T')[0] }
  }

  return cols
}

// Carries everything the Leads board has no column for (phone, location,
// full brief) plus the structured brief the team works from.
function formatUpdateNotes(enquiry) {
  const client = [enquiry.name, enquiry.organization].filter(Boolean).join(', ') || ''

  return [
    `*Client:* ${client}`,
    '',
    `*Email:* ${enquiry.email || ''}`,
    '',
    `*Phone:* ${enquiry.phone || ''}`,
    '',
    `*Event type:* ${enquiry.event_type || ''}`,
    '',
    `*Event Synopsis & Event Type (Internal/External):* ${enquiry.brief || ''}`,
    '',
    `*Fee: (This should be net fee)* ${enquiry.budget_range || ''} ${enquiry.currency || ''}`.trimEnd(),
    '',
    `*Date of the event:* ${enquiry.event_date || ''}`,
    '',
    `*Location of the event:* ${enquiry.event_location || ''}`,
    '',
    `*Audience size:* ${enquiry.audience_size || ''}`,
  ].join('\n')
}

async function mondayRequest(token, query, variables) {
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

// No dedicated event-name field on the form, so approximate one for the
// item title, e.g. "Acme Corp — Conference / Summit".
function buildItemName(enquiry) {
  return [enquiry.organization, enquiry.event_type].filter(Boolean).join(' — ')
    || enquiry.name
    || `Enquiry ${enquiry.id}`
}

// Creates a Leads-board item for a fresh website enquiry. Returns
// { id, name, boardId } or null — never throws, callers fire-and-forget.
export async function createMondayLead(enquiry) {
  const token = process.env.MONDAY_API_TOKEN
  const boardId = process.env.MONDAY_LEADS_BOARD_ID || LEADS_BOARD_ID

  if (!token) {
    console.log('[MONDAY] No MONDAY_API_TOKEN set, skipping')
    return null
  }

  const itemName = buildItemName(enquiry)

  const query = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues, create_labels_if_missing: true) {
      id
      name
    }
  }`

  // Pro-bono enquiries go straight to the Pro-Bono group; everything else
  // lands in New Leads for triage.
  const groupId = enquiry.engagement_type === 'Pro Bono'
    ? LEADS_PRO_BONO_GROUP
    : LEADS_NEW_LEADS_GROUP

  try {
    const columnValues = await buildColumnValues(enquiry)
    const data = await mondayRequest(token, query, {
      boardId: String(boardId),
      groupId,
      itemName,
      columnValues: JSON.stringify(columnValues),
    })

    if (data.errors?.length) {
      console.error('[MONDAY] GraphQL errors:', JSON.stringify(data.errors))
      return null
    }

    const item = data.data?.create_item
    if (!item?.id) {
      console.error('[MONDAY] create_item returned no item:', JSON.stringify(data))
      return null
    }
    console.log(`[MONDAY] Created lead "${item.name}" (ID: ${item.id}) on board ${boardId}`)

    // Post the structured brief as an update (comment) on the item
    try {
      const updateQuery = `mutation ($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) { id }
      }`
      const updateData = await mondayRequest(token, updateQuery, {
        itemId: String(item.id),
        body: formatUpdateNotes(enquiry),
      })
      if (updateData.errors?.length) {
        console.error('[MONDAY] Update GraphQL errors:', JSON.stringify(updateData.errors))
      } else {
        console.log(`[MONDAY] Posted update on item ${item.id}`)
      }
    } catch (err) {
      console.error('[MONDAY] Failed to post update:', err.message)
    }

    return { ...item, boardId: String(boardId) }
  } catch (err) {
    console.error('[MONDAY] Failed to create lead:', err.message)
    return null
  }
}

async function buildDealColumnValues(enquiry) {
  const cols = {}

  cols[DEALS_COLUMNS.eventName] = buildItemName(enquiry)
  cols[DEALS_COLUMNS.stage] = { label: 'Confirmed' }

  const fee = parseBudgetNumber(enquiry.budget_range)
  if (fee !== null) {
    cols[DEALS_COLUMNS.dealValue] = fee
  }

  const speakerLabels = await collectSpeakerLabels(enquiry)
  if (speakerLabels.length > 0) {
    cols[DEALS_COLUMNS.speaker] = speakerLabels.join(', ')
  }

  const { first } = parseEventDates(enquiry.event_date)
  if (first) {
    cols[DEALS_COLUMNS.eventDate] = { date: first }
  }

  if (enquiry.email) {
    cols[DEALS_COLUMNS.email] = { email: enquiry.email, text: enquiry.email }
  }

  const engagementLabel = ENGAGEMENT_LABELS[enquiry.engagement_type]
  if (engagementLabel) {
    cols[DEALS_COLUMNS.eventDescribes] = { label: engagementLabel }
  }

  return cols
}

// Promotes a confirmed enquiry to the Deals board (Qualified group, Stage:
// Confirmed). Moves the existing Leads-board item when we have one — updates
// and history travel with it — otherwise creates a fresh deal item. One-way:
// callers only invoke this on the transition to 'confirmed', and an enquiry
// already on the Deals board is left alone. Returns { id, name, boardId } or
// null — never throws, callers fire-and-forget.
export async function moveMondayLeadToDeals(enquiry) {
  const token = process.env.MONDAY_API_TOKEN
  const dealsBoardId = String(process.env.MONDAY_DEALS_BOARD_ID || DEALS_BOARD_ID)

  if (!token) {
    console.log('[MONDAY] No MONDAY_API_TOKEN set, skipping')
    return null
  }

  if (enquiry.monday_board_id === dealsBoardId) {
    console.log(`[MONDAY] Enquiry ${enquiry.id} already on deals board, skipping`)
    return null
  }

  try {
    const columnValues = await buildDealColumnValues(enquiry)

    // Move the existing lead item across if we have one
    if (enquiry.monday_item_id) {
      const moveQuery = `mutation ($boardId: ID!, $groupId: ID!, $itemId: ID!) {
        move_item_to_board(board_id: $boardId, group_id: $groupId, item_id: $itemId) {
          id
          name
        }
      }`
      const moveData = await mondayRequest(token, moveQuery, {
        boardId: dealsBoardId,
        groupId: DEALS_QUALIFIED_GROUP,
        itemId: String(enquiry.monday_item_id),
      })

      const moved = moveData.data?.move_item_to_board
      if (moveData.errors?.length || !moved?.id) {
        // Item may have been deleted/archived in Monday — fall through and
        // create a fresh deal item instead.
        console.error('[MONDAY] move_item_to_board failed, creating deal from scratch:', JSON.stringify(moveData.errors || moveData))
      } else {
        const setQuery = `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues, create_labels_if_missing: true) { id }
        }`
        const setData = await mondayRequest(token, setQuery, {
          boardId: dealsBoardId,
          itemId: String(moved.id),
          columnValues: JSON.stringify(columnValues),
        })
        if (setData.errors?.length) {
          console.error('[MONDAY] Failed to set deal columns after move:', JSON.stringify(setData.errors))
        }
        console.log(`[MONDAY] Moved lead ${moved.id} to deals board ${dealsBoardId}`)
        return { id: moved.id, name: moved.name, boardId: dealsBoardId }
      }
    }

    // No lead item on record (or the move failed) — create the deal directly
    const createQuery = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues, create_labels_if_missing: true) {
        id
        name
      }
    }`
    const createData = await mondayRequest(token, createQuery, {
      boardId: dealsBoardId,
      groupId: DEALS_QUALIFIED_GROUP,
      itemName: buildItemName(enquiry),
      columnValues: JSON.stringify(columnValues),
    })

    if (createData.errors?.length) {
      console.error('[MONDAY] GraphQL errors creating deal:', JSON.stringify(createData.errors))
      return null
    }

    const item = createData.data?.create_item
    if (!item?.id) {
      console.error('[MONDAY] create_item (deal) returned no item:', JSON.stringify(createData))
      return null
    }
    console.log(`[MONDAY] Created deal "${item.name}" (ID: ${item.id}) on board ${dealsBoardId}`)

    // Fresh item has no history from the lead, so attach the enquiry brief
    try {
      const updateQuery = `mutation ($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) { id }
      }`
      await mondayRequest(token, updateQuery, {
        itemId: String(item.id),
        body: formatUpdateNotes(enquiry),
      })
    } catch (err) {
      console.error('[MONDAY] Failed to post update on deal:', err.message)
    }

    return { ...item, boardId: dealsBoardId }
  } catch (err) {
    console.error('[MONDAY] Failed to move lead to deals:', err.message)
    return null
  }
}
