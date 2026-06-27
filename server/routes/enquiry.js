import express from 'express'
import { createEnquiry } from '../db/enquiry-queries.js'
import { createOrUpdateProfile, subscribeToList, trackEvent } from '../services/klaviyo.js'
import { validate, enquirySchema } from '../schemas/index.js'

const router = express.Router()

const ENQUIRY_LIST_ID = process.env.KLAVIYO_ENQUIRY_LIST_ID
const NEWSLETTER_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID

// Klaviyo — fire-and-forget (don't block the response)
async function notifyKlaviyo(email, listId, eventName, data = {}) {
  if (!process.env.KLAVIYO_API_KEY) {
    console.log(`[KLAVIYO] No API key — skipping`)
    return
  }

  try {
    await createOrUpdateProfile({
      email,
      name: data.name,
      organization: data.organization,
      properties: {
        source: 'speaker_enquiry',
        speaker_name: data.speakerName,
        event_date: data.eventDate,
      },
    })

    await subscribeToList(email, listId)

    if (eventName) {
      await trackEvent(eventName, email, {
        name: data.name,
        organization: data.organization,
        speaker_name: data.speakerName,
        event_date: data.eventDate,
        brief: data.brief,
      })
    }

    console.log(`[KLAVIYO] Profile + list + "${eventName || 'no event'}" for ${email}`)
  } catch (err) {
    console.error(`[KLAVIYO] Error for ${email}:`, err.message)
  }
}

// Submit enquiry
router.post('/', async (req, res) => {
  const data = validate(req, res, enquirySchema)
  if (!data) return

  try {
    const enquiry = await createEnquiry(data)
    console.log('NEW ENQUIRY:', enquiry.id)

    // Klaviyo — fire-and-forget (don't block the response)
    const klaviyoData = {
      name: data.name,
      organization: data.organization,
      speakerName: data.speakerName,
      eventDate: data.eventDate,
      brief: data.brief,
    }
    if (data.newsletter) {
      notifyKlaviyo(data.email, NEWSLETTER_LIST_ID, null, klaviyoData)
    }
    notifyKlaviyo(data.email, ENQUIRY_LIST_ID, 'Enquiry Submitted', klaviyoData)

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
