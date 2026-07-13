// Enquiry status values as stored in the enquiries.status column.
// IMPORTANT: keep in sync with server/constants/enums.js ENQUIRY_STATUSES.
export const ENQUIRY_STATUSES = [
  'new',
  'reviewed',
  'calendar_meeting',
  'confirmed',
  'contract_sent',
  'closed_won',
  'closed_lost',
  'paid_in_full',
  'rejected',
]

export const STATUS_LABELS = {
  new: 'New',
  reviewed: 'Reviewed',
  calendar_meeting: 'Calendar / Meeting',
  confirmed: 'Confirmed',
  contract_sent: 'Contract Sent',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  paid_in_full: 'Paid in Full',
  rejected: 'Rejected',
  // Legacy values that may still appear in older rows
  accepted: 'Accepted',
  responded: 'Responded',
  contacted: 'Contacted',
}
