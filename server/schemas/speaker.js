import { z } from 'zod'

// Shared shape for speaker creation. Used by:
//   - POST /api/admin/speakers (admin form, full required)
//   - PATCH /api/admin/speakers/:id (admin form, partial)
//   - POST /api/admin/review/:id/approve (admin, partial)
//   - POST /api/portal/:token (speaker portal, partial, no feeMin)
//
// camelCase keys to match the SpeakerForm component and queries.js fieldMap.

const tagArray = z.array(z.string().min(1).max(200)).max(30)

const socialProfileSchema = z.object({
  instagram: z.string().max(200).optional(),
  x: z.string().max(200).optional(),
  linkedin: z.string().max(200).optional(),
  youtube: z.string().max(200).optional(),
  tiktok: z.string().max(200).optional(),
}).partial().passthrough()

const baseSpeakerFields = {
  name: z.string().min(1).max(200),
  headline: z.string().min(1).max(300),
  photo: z.string().url().max(1000),
  bio: z.string().min(1).max(10000),
  topics: tagArray.optional(),
  audiences: tagArray.optional(),
  keynotes: z.array(z.string().min(1).max(500)).max(30).optional(),
  speakingFormat: z.string().max(500).optional().nullable(),
  videoUrl: z.union([z.string().url().max(500), z.literal('')]).optional().nullable(),
  socialProfiles: socialProfileSchema.optional(),
  gender: z.string().max(50).optional().nullable(),
  ethnicity: z.string().max(100).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  heroMediaType: z.enum(['image', 'video']).optional(),
  boostNotes: z.string().max(5000).optional().nullable(),
}

// Admin form: name/headline/photo/bio required, plus optional feeMin.
// Default (no .strict()) means unknown keys are silently stripped — clients
// won't break if they send legacy fields, but malformed types are still rejected.
export const speakerCreateSchema = z.object({
  ...baseSpeakerFields,
  feeMin: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  hidden: z.boolean().optional(),
})

// PATCH: every field optional, including the four required-on-create ones
export const speakerPatchSchema = z.object({
  ...baseSpeakerFields,
  feeMin: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  hidden: z.boolean().optional(),
}).partial()

// Portal: speakers update their own profile but cannot set their fee.
// `feeMin: z.never().optional()` actively rejects any feeMin value rather
// than silently stripping it (defence against a malicious portal client).
// Photo accepts an empty string (speaker may submit before uploading, or upload
// separately via the dropzone — the draft reviewer can check before approving).
// `hidden` is an admin-only visibility control — a speaker must not be able to
// hide or unhide themselves, so reject it here the same way we reject feeMin.
export const portalDraftSchema = z.object({
  ...baseSpeakerFields,
  photo: z.union([z.string().url().max(1000), z.literal('')]).optional().nullable(),
  feeMin: z.never().optional(),
  hidden: z.never().optional(),
}).partial().required({ name: true, headline: true, bio: true })
