import { z } from 'zod'
import {
  EVENT_TYPES,
  ENGAGEMENT_TYPES,
  HAS_BUDGET_OPTIONS,
  CURRENCY_CODES,
  ENQUIRY_STATUSES,
  EMAIL_TEMPLATES,
} from '../constants/enums.js'

const recommendationSchema = z.object({
  speakerId: z.string().min(1).max(100),
  speakerName: z.string().max(200).optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  reasoning: z.string().max(2000).optional().nullable(),
  selected: z.boolean().optional(),
}).strict()

export const enquirySchema = z.object({
  // identity (required)
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  organization: z.string().min(1).max(200),
  phone: z.string().max(30).optional().nullable(),

  // event (required by the form's flow)
  eventType: z.enum(EVENT_TYPES),
  eventDate: z.string().min(1).max(50),
  eventLocation: z.string().min(1).max(200),
  audienceSize: z.string().min(1).max(20),

  // engagement
  engagementType: z.enum(ENGAGEMENT_TYPES).optional().nullable(),
  budgetRange: z.string().max(100).optional().nullable(),
  currency: z.enum(CURRENCY_CODES).optional().nullable(),
  proBonoFlexible: z.boolean().optional(),

  // brief (required)
  brief: z.string().min(1).max(5000),

  // speaker selection
  speakerId: z.string().max(100).optional().nullable(),
  speakerName: z.string().max(200).optional().nullable(),
  additionalSpeakerIds: z.array(z.string().min(1).max(100)).max(20).optional(),

  // recommendations + comms
  recommendations: z.array(recommendationSchema).max(20).optional(),
  newsletter: z.boolean().optional(),
})

export const enquiryUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  admin_notes: z.string().max(10000).optional().nullable(),
  response_message: z.string().max(20000).optional().nullable(),
  rejection_reason: z.string().max(200).optional().nullable(),
  email_subject: z.string().max(300).optional().nullable(),
  email_template: z.enum(EMAIL_TEMPLATES).optional().nullable(),
})
