import express from 'express'
import { createEnquiry } from '../db/enquiry-queries.js'
import { validate, enquirySchema } from '../schemas/index.js'
import { addResendContact } from '../services/resend/index.js'
import { sendEnquiryEmail } from '../services/notifications.js'

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

  sendEnquiryEmail(enquiry, 'enquiry_received')
    .catch(err => console.error(`[RESEND] enquiry received email failed for ${data.email}:`, err.message))

  if (data.newsletter) {
    const [firstName, ...rest] = (data.name || '').trim().split(/\s+/)
    // TODO
    // addResendContact(data.email, {
    //   firstName: firstName || '',
    //   lastName: rest.join(' '),
    //   topicId: undefined,
    // }).catch(err => console.error(`[RESEND] add contact failed for ${data.email}:`, err.message))
  }
})

export default router
