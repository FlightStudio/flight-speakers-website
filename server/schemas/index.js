// Shared validation helper: parse a request body against a zod schema, or
// send a structured 400. Routes use it like:
//
//   const data = validate(req, res, enquirySchema); if (!data) return;
//
// On failure, returns null after writing the response. The caller stops.
//
// On success, returns the parsed (and stripped) data, ready to use.

export function validate(req, res, schema) {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const issues = result.error.issues.map(i => ({
      path: i.path.join('.') || '<root>',
      message: i.message,
    }))
    res.status(400).json({
      success: false,
      message: 'Invalid request body',
      issues,
    })
    return null
  }
  return result.data
}

export { speakerCreateSchema, speakerPatchSchema, portalDraftSchema } from './speaker.js'
export { enquirySchema, enquiryUpdateSchema } from './enquiry.js'
export { waitlistSchema, waitlistUpdateSchema } from './waitlist.js'
export { articlePatchSchema, articleRejectSchema } from './article.js'
