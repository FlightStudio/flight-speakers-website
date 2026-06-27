import express from 'express'
import { createEnquiry } from '../db/enquiry-queries.js'
import { validate, enquirySchema } from '../schemas/index.js'
import { addResendContact, mailer } from '../services/resend/index.js'

const router = express.Router()

// Submit enquiry
router.post('/', async (req, res) => {
  const data = validate(req, res, enquirySchema)
  if (!data) return

  let enquiry
  try {
    enquiry = await createEnquiry(data)
    console.log('NEW ENQUIRY:', enquiry.id)
  } catch (error) {
    console.error('Enquiry submission error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to submit enquiry. Please try again.',
    })
  }

  res.status(201).json({
    success: true,
    message: 'Enquiry submitted successfully',
    enquiryId: enquiry.id,
  });

  // mailer.SEND_ENQIRY_SUBMITTED_EMAIL(data.email, {
  //   name: data.name,
  //   organization: data.organization,
  //   speakerName: data.speakerName,
  //   eventDate: data.eventDate,
  //   brief: data.brief,
  // }).catch(err => console.error(`[RESEND] enquiry email failed for ${data.email}:`, err.message))

  if (data.newsletter) {
    const [firstName, ...rest] = (data.name || '').trim().split(/\s+/)
    addResendContact(data.email, {
      firstName: firstName || '',
      lastName: rest.join(' '),
      topicId: undefined,
    }).catch(err => console.error(`[RESEND] add contact failed for ${data.email}:`, err.message))
  }
})

export default router
