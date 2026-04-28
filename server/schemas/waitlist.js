import { z } from 'zod'

const TOPIC_OPTIONS = [
  'Leadership & Culture',
  'Business & Strategy',
  'Technology & AI',
  'Health & Performance',
  'Marketing & Brand',
  'Entrepreneurship',
  'Future of Work',
  'Diversity & Inclusion',
  'Creator Economy',
  'Other',
]

const SPEAKING_EXPERIENCE_OPTIONS = [
  'Just starting out',
  '5–25 paid talks',
  '25–100 paid talks',
  '100+ paid talks',
  "Don't track this — I speak when invited",
]

const REPRESENTATION_STATUS_OPTIONS = [
  'Looking for exclusive representation',
  'Open to non-exclusive representation',
  'Currently represented elsewhere',
  'Not sure yet',
]

const CURRENCY_CODES = ['GBP', 'USD', 'EUR']

export const waitlistSchema = z.object({
  // Section 01 — About You
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional().nullable(),
  basedIn: z.string().min(1).max(200),
  titleCompany: z.string().min(1).max(200),

  // Section 02 — Your Work
  speaksAbout: z.string().min(1).max(2000),
  topics: z.array(z.enum(TOPIC_OPTIONS)).min(1).max(10),
  speakingExperience: z.enum(SPEAKING_EXPERIENCE_OPTIONS),
  feeCurrency: z.enum(CURRENCY_CODES),
  feeBracket: z.string().min(1).max(100),

  // Section 03 — Profile & Links
  website: z.string().url().max(500).optional().nullable().or(z.literal('')),
  linkedin: z.string().max(200).optional().nullable(),
  showreel: z.string().url().max(500).optional().nullable().or(z.literal('')),
  instagram: z.string().max(100).optional().nullable(),
  notableEngagements: z.string().max(2000).optional().nullable(),

  // Section 04 — Representation
  representationStatus: z.enum(REPRESENTATION_STATUS_OPTIONS),
  whyFlightspeakers: z.string().max(2000).optional().nullable(),

  // Consent — validated client-side; we accept the submission if it reaches us
  consent: z.boolean().optional(),
})

export const waitlistUpdateSchema = z.object({
  status: z.enum(['new', 'reviewed', 'invited', 'declined']).optional(),
  admin_notes: z.string().max(10000).optional().nullable(),
})
