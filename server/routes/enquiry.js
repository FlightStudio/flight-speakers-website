import express from 'express'
import nodemailer from 'nodemailer'

const router = express.Router()

// In-memory storage for MVP (would be database in production)
const enquiries = []

// Email configuration (would use real SMTP in production)
// For MVP, we'll log emails instead of sending them
const sendEmail = async (enquiryData) => {
  console.log('='.repeat(50))
  console.log('NEW ENQUIRY RECEIVED')
  console.log('='.repeat(50))
  console.log('From:', enquiryData.name, `<${enquiryData.email}>`)
  console.log('Organization:', enquiryData.organization)
  console.log('Phone:', enquiryData.phone || 'Not provided')
  console.log('-'.repeat(50))
  console.log('Event Type:', enquiryData.eventType || 'Not specified')
  console.log('Event Date:', enquiryData.eventDate || 'Not specified')
  console.log('Location:', enquiryData.eventLocation || 'Not specified')
  console.log('Audience Size:', enquiryData.audienceSize || 'Not specified')
  console.log('Budget Range:', enquiryData.budgetRange || 'Not specified')
  if (enquiryData.speakerName) {
    console.log('Speaker Interest:', enquiryData.speakerName)
  }
  console.log('-'.repeat(50))
  console.log('Brief:')
  console.log(enquiryData.brief)
  console.log('-'.repeat(50))
  console.log('Newsletter Opt-in:', enquiryData.newsletter ? 'Yes' : 'No')
  console.log('='.repeat(50))

  // In production, uncomment this to send real emails:
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: 'speakers@flightstory.com',
    subject: `New Speaker Enquiry from ${enquiryData.name} - ${enquiryData.organization}`,
    html: generateEmailHTML(enquiryData),
  })
  */

  return true
}

// Generate email HTML (for production use)
const generateEmailHTML = (data) => {
  return `
    <h1>New Speaker Enquiry</h1>
    <h2>Contact Details</h2>
    <ul>
      <li><strong>Name:</strong> ${data.name}</li>
      <li><strong>Organization:</strong> ${data.organization}</li>
      <li><strong>Email:</strong> ${data.email}</li>
      <li><strong>Phone:</strong> ${data.phone || 'Not provided'}</li>
    </ul>
    <h2>Event Details</h2>
    <ul>
      <li><strong>Event Type:</strong> ${data.eventType || 'Not specified'}</li>
      <li><strong>Date:</strong> ${data.eventDate || 'Not specified'}</li>
      <li><strong>Location:</strong> ${data.eventLocation || 'Not specified'}</li>
      <li><strong>Audience Size:</strong> ${data.audienceSize || 'Not specified'}</li>
      <li><strong>Budget Range:</strong> ${data.budgetRange || 'Not specified'}</li>
      ${data.speakerName ? `<li><strong>Speaker Interest:</strong> ${data.speakerName}</li>` : ''}
    </ul>
    <h2>Brief</h2>
    <p>${data.brief.replace(/\n/g, '<br>')}</p>
    <hr>
    <p><em>Newsletter Opt-in: ${data.newsletter ? 'Yes' : 'No'}</em></p>
  `
}

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
    } = req.body

    // Validation
    if (!name || !email || !organization || !brief) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, email, organization, brief)',
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      })
    }

    // Create enquiry object
    const enquiry = {
      id: `enq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      organization,
      email,
      phone: phone || null,
      eventDate: eventDate || null,
      eventLocation: eventLocation || null,
      audienceSize: audienceSize || null,
      budgetRange: budgetRange || null,
      eventType: eventType || null,
      brief,
      speakerId: speakerId || null,
      speakerName: speakerName || null,
      newsletter: newsletter || false,
      createdAt: new Date().toISOString(),
      status: 'new',
    }

    // Store enquiry
    enquiries.push(enquiry)

    // Send email notification
    await sendEmail(enquiry)

    // In production, this would also:
    // 1. Add to Klaviyo list for CRM
    // 2. Trigger webhook to Slack/other notification system
    // 3. Store in database

    // Log for Klaviyo integration (MVP placeholder)
    if (newsletter) {
      console.log('KLAVIYO: Add to speaker-newsletter list:', email)
    }
    console.log('KLAVIYO: Add to speaker-enquiries list:', email)

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

// Get all enquiries (admin endpoint)
router.get('/', (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY
  const provided = req.headers['x-admin-key']

  if (!adminKey || provided !== adminKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  res.json({
    success: true,
    count: enquiries.length,
    enquiries,
  })
})

export default router
