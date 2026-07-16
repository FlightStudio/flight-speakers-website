import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { getEnquiries, getEnquiryById, updateEnquiry } from '../../db/enquiry-queries.js'
import { getSentEmailsByEnquiryId } from '../../db/email-queries.js'
import { getSpeakerById, getRelatedSpeakers } from '../../db/queries.js'
import { semanticSearch } from '../../services/claude/claude.js'
import { notifyEnquiryResponse } from '../../services/notifications.js'
import { moveMondayLeadToDeals } from '../../services/monday.js'
import { validate, enquiryUpdateSchema } from '../../schemas/index.js'

const router = express.Router()

router.get('/enquiries', requireAdmin, async (req, res) => {
  try {
    const { status, engagementType, rejectionReason, urgent, page = 1, limit = 20, sort = 'newest' } = req.query
    const result = await getEnquiries({
      status,
      engagementType,
      rejectionReason,
      urgent: urgent === 'true',
      page: Math.max(parseInt(page, 10) || 1, 1),
      limit: Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100),
      sort,
    })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Enquiries list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries' })
  }
})

router.get('/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    const enquiry = await getEnquiryById(req.params.id)
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' })
    }

    // Auto-mark as reviewed if new
    if (enquiry.status === 'new') {
      await updateEnquiry(enquiry.id, { status: 'reviewed' })
      enquiry.status = 'reviewed'
      enquiry.reviewed_at = new Date().toISOString()

      // Reviewed enquiries move to the Monday Deals board (fire-and-forget)
      moveMondayLeadToDeals(enquiry)
        .catch(err => console.error(`[MONDAY] deals move failed for ${enquiry.id}:`, err.message))
    }

    // Fetch speaker recommendations
    let requestedSpeaker = null
    let relatedSpeakers = []
    let semanticMatches = []
    let additionalSpeakers = []

    if (enquiry.speaker_id) {
      try {
        requestedSpeaker = await getSpeakerById(enquiry.speaker_id)
        if (requestedSpeaker) {
          relatedSpeakers = await getRelatedSpeakers(enquiry.speaker_id, requestedSpeaker.topics, 6)
        }
      } catch (err) { console.warn('[admin enquiry detail] requested-speaker lookup failed:', err.message) }
    }

    if (enquiry.brief) {
      try {
        const searchResult = await semanticSearch(enquiry.brief, enquiry.speaker_id ? 4 : 8)
        semanticMatches = (searchResult.speakers || []).filter(
          s => s.id !== enquiry.speaker_id
        )
      } catch (err) { console.warn('[admin enquiry detail] semantic search failed:', err.message) }
    }

    // Resolve additional speaker IDs to full objects
    const additionalIds = enquiry.additional_speaker_ids || []
    if (additionalIds.length > 0) {
      try {
        const resolved = await Promise.all(additionalIds.map(id => getSpeakerById(id)))
        additionalSpeakers = resolved.filter(Boolean)
      } catch (err) { console.warn('[admin enquiry detail] additional-speaker lookup failed:', err.message) }
    }

    let sentEmails = []
    try {
      sentEmails = await getSentEmailsByEnquiryId(enquiry.id)
    } catch (err) { console.warn('[admin enquiry detail] sent-emails lookup failed:', err.message) }

    res.json({
      success: true,
      enquiry,
      sentEmails,
      speakers: {
        requested: requestedSpeaker,
        related: relatedSpeakers,
        semantic: semanticMatches,
        additional: additionalSpeakers,
      },
    })
  } catch (err) {
    console.error('Enquiry detail error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry' })
  }
})

router.patch('/enquiries/:id', requireAdmin, async (req, res) => {
  const data = validate(req, res, enquiryUpdateSchema)
  if (!data) return
  try {
    const enquiry = await getEnquiryById(req.params.id)
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' })
    }

    const { status, admin_notes, response_message, rejection_reason, email_template } = data
    const updates = {}
    if (status) updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes
    if (response_message !== undefined) updates.response_message = response_message
    if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason

    const updated = await updateEnquiry(req.params.id, updates)

    let emailSent
    if (email_template || status) {
      ({ emailSent } = await notifyEnquiryResponse(updated, status, { email_template }))
    }

    let sentEmails = []
    try {
      sentEmails = await getSentEmailsByEnquiryId(updated.id)
    } catch (err) { console.warn('[admin enquiry update] sent-emails lookup failed:', err.message) }

    res.json({ success: true, enquiry: updated, sentEmails, ...(emailSent !== undefined && { emailSent }) })
  } catch (err) {
    console.error('Enquiry update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update enquiry' })
  }
})

export default router
