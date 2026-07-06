// Shared enum values for server-side validation.
// IMPORTANT: keep in sync with src/hooks/useMultiStepForm.js until we
// extract a shared module. Drift between client and server will silently
// reject valid client submissions or accept invalid ones.

export const EVENT_TYPES = [
  'Conference / Summit',
  'Corporate Offsite',
  'Leadership Event',
  'Product Launch',
  'Sales Kickoff',
  'Awards / Gala',
  'Internal Training',
  'Virtual Event',
  'Other',
]

export const ENGAGEMENT_TYPES = ['Paid', 'Pro Bono']

export const HAS_BUDGET_OPTIONS = ['Yes', 'No']

export const CURRENCY_CODES = ['USD', 'GBP', 'EUR']

export const ENQUIRY_STATUSES = ['new', 'reviewed', 'accepted', 'rejected', 'responded']

export const EMAIL_TEMPLATES = [
  'enquiry_processing',
  'exclusivity',
  'match_expired',
  'post_event_feedback',
  'pro_bono',
  'reengagement',
  'no_availability',
]

export const DRAFT_TYPES = ['new', 'update']
export const DRAFT_STATUSES = ['pending', 'approved', 'rejected']
