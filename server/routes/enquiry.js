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
      recommendations,
    } = req.body

    // Validation
    if (!name || !email || !organization || !brief) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, email, organisation, brief)',
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
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
      recommendations,
    })

    console.log('NEW ENQUIRY:', enquiry.id, '—', name, `<${email}>`)

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
