import { getSpeakerNamesByIds } from '../db/queries.js'
import { setEnquiryMondayItem } from '../db/enquiry-queries.js'

const MONDAY_API_URL = 'https://api.monday.com/v2'

// Board/column IDs for the July 2026 Monday boards. New website enquiries
// land on the LEADS board — Paid Leads or Pro-Bono Leads group depending on
// engagement type — and move to the DEALS board when the enquiry is marked
// as reviewed. The Leads board is Monday's CRM template, so the item title
// is the contact's name (the "Create a contact" button reads it).
const LEADS_BOARD_ID = '1559619026'
const LEADS_PAID_GROUP = 'topics'             // "Paid Leads"
const LEADS_PRO_BONO_GROUP = 'group_mm587rnn' // "Pro-Bono Leads"

const LEADS_COLUMNS = {
  company: 'lead_company',         // text — Company
  email: 'lead_email',             // email — Email
  phone: 'lead_phone',             // phone — Phone
  eventType: 'dropdown_mm58av8r',  // dropdown — Event Type (send ids, see below)
  date: 'date_mm583830',           // date — Date
  eventName: 'text_mm58aet1',      // text — Event Name
  location: 'text_mm5896yp',       // text — Location
  paidOrProBono: 'color_mm58cxd4', // status — Paid or Pro-Bono
  currency: 'text_mm58e2c5',       // text — Currency
  budget: 'numeric_mm582k09',      // numbers — Budget
  brief: 'text_mm58pgtv',          // text — Brief
  speakers: 'dropdown_mm58bbjc',   // dropdown — Which Speaker are you interested in?
  audience: 'text_mm58a2kv',       // text — Audience
  speakerAgency: 'color_mm58d9ke', // status — Speaker Agency
}
// Never set from here: `lead_status` (team triages), `text` (contact's job
// title — not collected), `numeric_mm58d9vt` (Speaking Fee — negotiated
// later), `text_mm58b2wc` (Anything else — additionalDetails isn't
// persisted to the enquiries table yet).

// dropdown_mm58av8r option ids. Sent as ids, not labels — several board
// labels have irregular spacing ("Conference/ Summit", "Awards/ Gala") that
// silently fails an exact-text match.
const EVENT_TYPE_IDS = {
  'Conference / Summit': 1,
  'Corporate Offsite': 3,
  'Leadership Event': 4,
  'Product Launch': 5,
  'Sales Kickoff': 6,
  'Awards / Gala': 7,
  'Internal Training': 8,
  'Virtual Event': 9,
  'Other': 10,
}

// color_mm58cxd4 indexes — the board spells it "Pro-Bono" (hyphenated), so
// indexes are safer than label text. Speaker Agency only has "Yes" (index 1);
// there is no "No" label, so false simply leaves the column empty.
const ENGAGEMENT_INDEXES = { 'Pro Bono': 0, 'Paid': 1 }
const SPEAKER_AGENCY_YES_INDEX = 1

// A reviewed enquiry becomes a deal. One-way — later status changes never
// move it back to Leads.
const DEALS_BOARD_ID = '1559619030'
const DEALS_REVIEWED_GROUP = 'group_mm58cvg7' // "Reviewed"
const DEALS_COLUMNS = {
  stage: 'deal_stage',      // status — Stage
  dealValue: 'deal_value',  // numbers — Deal Value
}
// deal_stage label indexes mirror the enquiry pipeline — enquiry status →
// stage index. 'new' has no stage: a new enquiry is still a lead.
const STATUS_STAGE_INDEXES = {
  reviewed: 4,          // Reviewed
  calendar_meeting: 15, // Calendar / Meeting
  negotiation: 3,       // Negotiation
  confirmed: 0,         // Confirmed
  contract_sent: 7,     // Contract Sent
  closed_won: 1,        // Closed Won
  closed_lost: 2,       // Closed Lost
  completed_event: 6,   // Completed Event
  declined: 5,          // Declined
}
// Team-managed: deal_owner, deal_contact, deal_expected_close_date,
// deal_close_probability. deal_forecast_value is read-only.

// Best-effort numeric budget from free-text ranges like "5000",
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
// "2026-03-15|2026-03-20". The board has a single date column, so only the
// first date is sent; the raw string still appears in the item update.
function parseFirstEventDate(eventDate) {
  if (!eventDate) return null
  const parts = String(eventDate).split('|').map(p => parseDateString(p.trim())).filter(Boolean)
  return parts[0] || null
}

// Monday's phone column wants a countryShortName alongside the number.
function phoneCountry(phone) {
  const p = String(phone).replace(/[\s()-]/g, '')
  if (p.startsWith('+44')) return 'GB'
  if (p.startsWith('+353')) return 'IE'
  if (p.startsWith('+971')) return 'AE'
  if (p.startsWith('+61')) return 'AU'
  if (p.startsWith('+1')) return 'US'
  return ''
}

function parseRecommendations(recommendations) {
  if (Array.isArray(recommendations)) return recommendations
  if (typeof recommendations === 'string') {
    try { return JSON.parse(recommendations) } catch { return [] }
  }
  return []
}

// Dropdown labels for `dropdown_mm58bbjc`: primary speaker, any additional
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

async function buildLeadColumnValues(enquiry) {
  const cols = {}

  if (enquiry.organization) {
    cols[LEADS_COLUMNS.company] = enquiry.organization
  }

  if (enquiry.email) {
    cols[LEADS_COLUMNS.email] = { email: enquiry.email, text: enquiry.email }
  }

  if (enquiry.phone) {
    cols[LEADS_COLUMNS.phone] = { phone: enquiry.phone, countryShortName: phoneCountry(enquiry.phone) }
  }

  const eventTypeId = EVENT_TYPE_IDS[enquiry.event_type]
  if (eventTypeId != null) {
    cols[LEADS_COLUMNS.eventType] = { ids: [eventTypeId] }
  }

  const firstDate = parseFirstEventDate(enquiry.event_date)
  if (firstDate) {
    cols[LEADS_COLUMNS.date] = { date: firstDate }
  }

  if (enquiry.event_name) {
    cols[LEADS_COLUMNS.eventName] = enquiry.event_name
  }

  if (enquiry.event_location) {
    cols[LEADS_COLUMNS.location] = enquiry.event_location
  }

  const engagementIndex = ENGAGEMENT_INDEXES[enquiry.engagement_type]
  if (engagementIndex != null) {
    cols[LEADS_COLUMNS.paidOrProBono] = { index: engagementIndex }
  }

  if (enquiry.currency) {
    cols[LEADS_COLUMNS.currency] = enquiry.currency
  }

  const budget = parseBudgetNumber(enquiry.budget_range)
  if (budget !== null) {
    cols[LEADS_COLUMNS.budget] = budget
  }

  if (enquiry.brief) {
    cols[LEADS_COLUMNS.brief] = enquiry.brief.substring(0, 2000)
  }

  const speakerLabels = await collectSpeakerLabels(enquiry)
  if (speakerLabels.length > 0) {
    cols[LEADS_COLUMNS.speakers] = { labels: speakerLabels }
  }

  if (enquiry.audience_size) {
    cols[LEADS_COLUMNS.audience] = String(enquiry.audience_size)
  }

  if (enquiry.is_speakers_agency) {
    cols[LEADS_COLUMNS.speakerAgency] = { index: SPEAKER_AGENCY_YES_INDEX }
  }

  return cols
}

// Human-readable summary posted as an update on the item — carries the full
// untruncated brief plus everything at a glance.
function formatUpdateNotes(enquiry) {
  const client = [enquiry.name, enquiry.organization].filter(Boolean).join(', ') || ''

  return [
    `*Client:* ${client}`,
    '',
    `*Email:* ${enquiry.email || ''}`,
    '',
    `*Phone:* ${enquiry.phone || ''}`,
    '',
    `*Event Name:* ${enquiry.event_name || ''}`,
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

// CRM leads board: item title is the contact's name.
function buildItemName(enquiry) {
  return enquiry.name || enquiry.organization || `Enquiry ${enquiry.id}`
}

async function saveMondayRef(enquiryId, itemId, boardId) {
  try {
    await setEnquiryMondayItem(enquiryId, itemId, boardId)
  } catch (err) {
    console.error(`[MONDAY] Failed to save monday ref for ${enquiryId}:`, err.message)
  }
}

// Creates a Leads-board item for a fresh website enquiry and records the
// item/board id on the enquiry row. Returns { id, name, boardId } or null —
// never throws, callers fire-and-forget.
export async function createMondayLead(enquiry) {
  const token = process.env.MONDAY_API_TOKEN
  const boardId = process.env.MONDAY_LEADS_BOARD_ID || LEADS_BOARD_ID

  if (!token) {
    console.log('[MONDAY] No MONDAY_API_TOKEN set, skipping')
    return null
  }

  // Pro-bono enquiries land in the Pro-Bono Leads group; everything else
  // (Paid, or no engagement type given) goes to Paid Leads.
  const groupId = enquiry.engagement_type === 'Pro Bono'
    ? LEADS_PRO_BONO_GROUP
    : LEADS_PAID_GROUP

  const query = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues, create_labels_if_missing: true) {
      id
      name
    }
  }`

  try {
    const columnValues = await buildLeadColumnValues(enquiry)
    const data = await mondayRequest(token, query, {
      boardId: String(boardId),
      groupId,
      itemName: buildItemName(enquiry),
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

    await saveMondayRef(enquiry.id, item.id, String(boardId))

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

function buildDealColumnValues(enquiry) {
  const cols = {
    [DEALS_COLUMNS.stage]: { index: STATUS_STAGE_INDEXES.reviewed },
  }

  const value = parseBudgetNumber(enquiry.budget_range)
  if (value !== null) {
    cols[DEALS_COLUMNS.dealValue] = value
  }

  return cols
}

// Mirrors an enquiry status change onto the deal's Stage column. Only acts
// on items already on the Deals board — moving from Leads happens
// exclusively via the reviewed transition (moveMondayLeadToDeals), so a
// status set while the item is still a lead is skipped and Monday catches
// up at the next stage change after review. Never throws.
export async function updateMondayDealStage(enquiry, status) {
  const token = process.env.MONDAY_API_TOKEN
  const dealsBoardId = String(process.env.MONDAY_DEALS_BOARD_ID || DEALS_BOARD_ID)

  if (!token) {
    console.log('[MONDAY] No MONDAY_API_TOKEN set, skipping')
    return null
  }

  const stageIndex = STATUS_STAGE_INDEXES[status]
  if (stageIndex == null) return null

  if (!enquiry.monday_item_id || enquiry.monday_board_id !== dealsBoardId) {
    console.log(`[MONDAY] Enquiry ${enquiry.id} not on deals board, skipping stage update (${status})`)
    return null
  }

  try {
    const setQuery = `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) { id }
    }`
    const data = await mondayRequest(token, setQuery, {
      boardId: dealsBoardId,
      itemId: String(enquiry.monday_item_id),
      columnValues: JSON.stringify({ [DEALS_COLUMNS.stage]: { index: stageIndex } }),
    })

    if (data.errors?.length) {
      console.error('[MONDAY] Failed to update deal stage:', JSON.stringify(data.errors))
      return null
    }

    console.log(`[MONDAY] Set deal ${enquiry.monday_item_id} stage to "${status}"`)
    return { id: String(enquiry.monday_item_id), boardId: dealsBoardId }
  } catch (err) {
    console.error('[MONDAY] Failed to update deal stage:', err.message)
    return null
  }
}

// Moves a reviewed enquiry to the Deals board (Reviewed group, Stage:
// Reviewed). Moves the existing Leads-board item when we have one — updates
// and history travel with it — otherwise creates a fresh deal item. One-way:
// an enquiry already on the Deals board is left alone, so repeat triggers
// are harmless. Records the item/board id on the enquiry row. Returns
// { id, name, boardId } or null — never throws, callers fire-and-forget.
export async function moveMondayLeadToDeals(enquiry) {
  const token = process.env.MONDAY_API_TOKEN
  const dealsBoardId = String(process.env.MONDAY_DEALS_BOARD_ID || DEALS_BOARD_ID)

  if (!token) {
    console.log('[MONDAY] No MONDAY_API_TOKEN set, skipping')
    return null
  }

  if (enquiry.monday_board_id === dealsBoardId) {
    // Already a deal — just make sure the stage reflects the (re-)review.
    console.log(`[MONDAY] Enquiry ${enquiry.id} already on deals board — syncing stage instead`)
    return updateMondayDealStage(enquiry, 'reviewed')
  }

  try {
    const columnValues = buildDealColumnValues(enquiry)

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
        groupId: DEALS_REVIEWED_GROUP,
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
        await saveMondayRef(enquiry.id, moved.id, dealsBoardId)
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
      groupId: DEALS_REVIEWED_GROUP,
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

    await saveMondayRef(enquiry.id, item.id, dealsBoardId)

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
