import { z } from 'zod'

const bodyBlockSchema = z.object({
  type: z.enum(['p', 'h2']),
  text: z.string().min(1).max(5000),
})

export const articlePatchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  category: z.string().min(1).max(100).optional(),
  excerpt: z.string().min(1).max(1000).optional(),
  body: z.array(bodyBlockSchema).min(1).optional(),
  image: z.string().url().max(500).optional().nullable(),
  imageCredit: z.string().max(300).optional().nullable(),
  tileC1: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour').optional().nullable(),
  tileC2: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour').optional().nullable(),
  readTime: z.number().int().min(1).max(60).optional(),
  adminNotes: z.string().max(10000).optional().nullable(),
})

export const articleRejectSchema = z.object({
  notes: z.string().max(10000).optional().nullable(),
})
