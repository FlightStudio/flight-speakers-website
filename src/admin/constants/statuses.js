// Enquiry status values as stored in the enquiries.status column.
// IMPORTANT: keep in sync with server/constants/enums.js ENQUIRY_STATUSES.
export const ENQUIRY_STATUSES = [
  'new',
  'reviewed',
  'calendar_meeting',
  'confirmed',
  'contacted',
  'closed_won',
  'closed_lost',
  'rejected',
]

export const STATUS_LABELS = {
  new: 'New',
  reviewed: 'Reviewed',
  calendar_meeting: 'Calendar Meeting',
  confirmed: 'Confirmed',
  contacted: 'Contacted',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  rejected: 'Rejected',
  // Legacy values that may still appear in older rows
  accepted: 'Accepted',
  responded: 'Responded',
}
