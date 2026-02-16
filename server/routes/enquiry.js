import express from 'express'
import { createEnquiry } from '../db/enquiry-queries.js'
import { notifyKlaviyo } from '../services/notifications.js'

const router = express.Router()

// Submit enquiry
router.post('/', async (req, res) => {
  try {
    const {
      name,
      organization,
      email,
      phone,
      eventDate,
      eventLocation,
      audienceSize,
      budgetRange,
      eventType,
      brief,
      speakerId,
      speakerName,
      newsletter,
      additionalSpeakerIds,
      currency,
      engagementType,
      hasBudget,
      proBonoFlexible,
      recommendations,
    } = req.body

    // Validation
    if (!name || !email || !organization || !brief) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, email, organisation, brief)',
      })
    }

    if (!eventType || !eventDate || !eventLocation || !audienceSize) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required event details (type, date, location, audience size)',
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      })
    }

    if (brief.length > 5000 || name.length > 200 || organization.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'One or more fields exceed the maximum length',
      })
    }

    // Validate secondary field lengths
    if ((phone && phone.length > 30) || (eventLocation && eventLocation.length > 200) ||
        (budgetRange && budgetRange.length > 100) || (eventType && eventType.length > 100) ||
        (audienceSize && String(audienceSize).length > 20)) {
      return res.status(400).json({
        success: false,
        message: 'One or more fields exceed the maximum length',
      })
    }

    // Persist to database
    const enquiry = await createEnquiry({
      name,
      organization,
      email,
      phone,
      eventDate,
      eventLocation,
      audienceSize,
      budgetRange,
      eventType,
      brief,
      speakerId,
      speakerName,
      newsletter,
      additionalSpeakerIds,
      currency,
      engagementType,
      hasBudget,
      proBonoFlexible,
      recommendations,
    })

    console.log('NEW ENQUIRY:', enquiry.id)

    // Klaviyo stubs
    if (newsletter) {
      await notifyKlaviyo(email, 'speaker-newsletter', { name })
    }
    await notifyKlaviyo(email, 'speaker-enquiries', { name, organization })

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      enquiryId: enquiry.id,
    })
  } catch (error) {
    console.error('Enquiry submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit enquiry. Please try again.',
    })
  }
})

export default router
