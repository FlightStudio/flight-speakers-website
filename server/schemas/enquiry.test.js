import { describe, it, expect } from 'vitest'
import { enquirySchema, enquiryUpdateSchema } from './enquiry.js'

describe('enquirySchema', () => {
  const valid = {
    name: 'Alice',
    email: 'alice@example.com',
    organization: 'Acme',
    brief: 'We need a great speaker for our offsite.',
    eventType: 'Conference / Summit',
    eventDate: '2026-09-15',
    eventLocation: 'London, UK',
    audienceSize: '500',
  }

  it('accepts a minimal valid enquiry', () => {
    const result = enquirySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = enquirySchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['name'])
  })

  it('rejects invalid email', () => {
    const result = enquirySchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['email'])
  })

  it('rejects email over 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@x.com' // 256 chars, exceeds the 254 cap
    const result = enquirySchema.safeParse({ ...valid, email: longEmail })
    expect(result.success).toBe(false)
  })

  it('rejects engagementType not in enum', () => {
    const result = enquirySchema.safeParse({ ...valid, engagementType: 'Sponsored' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['engagementType'])
  })

  it('rejects additionalSpeakerIds with more than 20 entries', () => {
    const result = enquirySchema.safeParse({
      ...valid,
      additionalSpeakerIds: Array.from({ length: 21 }, (_, i) => `s-${i}`),
    })
    expect(result.success).toBe(false)
  })

  it('rejects additionalSpeakerIds that is not an array', () => {
    const result = enquirySchema.safeParse({ ...valid, additionalSpeakerIds: 'one,two' })
    expect(result.success).toBe(false)
  })

  it('rejects recommendations with bad shape', () => {
    const result = enquirySchema.safeParse({
      ...valid,
      recommendations: [{ speakerId: 'x', score: 200 }],
    })
    expect(result.success).toBe(false)
  })

  it('silently strips unknown fields', () => {
    const result = enquirySchema.safeParse({ ...valid, malicious: 'payload' })
    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('malicious')
  })

  it('accepts a fully populated enquiry', () => {
    const result = enquirySchema.safeParse({
      ...valid,
      phone: '+44 7700 900000',
      eventType: 'Conference / Summit',
      eventDate: '2026-09-15',
      eventLocation: 'London, UK',
      audienceSize: '500',
      engagementType: 'Paid',
      budgetRange: '25000-40000',
      currency: 'GBP',
      proBonoFlexible: false,
      speakerId: 'steven-bartlett',
      speakerName: 'Steven Bartlett',
      additionalSpeakerIds: ['nir-eyal', 'davina-mccall'],
      recommendations: [{ speakerId: 'nir-eyal', score: 92, selected: true }],
      newsletter: true,
    })
    expect(result.success).toBe(true)
  })
})

describe('enquiryUpdateSchema', () => {
  it('accepts a status change', () => {
    const result = enquiryUpdateSchema.safeParse({ status: 'confirmed' })
    expect(result.success).toBe(true)
  })

  it('rejects unknown status', () => {
    const result = enquiryUpdateSchema.safeParse({ status: 'archived' })
    expect(result.success).toBe(false)
  })
})
