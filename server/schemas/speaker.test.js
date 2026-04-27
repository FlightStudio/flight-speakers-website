import { describe, it, expect } from 'vitest'
import { speakerCreateSchema, speakerPatchSchema, portalDraftSchema } from './speaker.js'

const validCreate = {
  name: 'Test Speaker',
  headline: 'Test Headline',
  photo: 'https://example.com/photo.jpg',
  bio: 'Test bio paragraph.',
}

describe('speakerCreateSchema', () => {
  it('accepts the minimum required fields', () => {
    expect(speakerCreateSchema.safeParse(validCreate).success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = speakerCreateSchema.safeParse({ ...validCreate, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects non-array topics', () => {
    const result = speakerCreateSchema.safeParse({ ...validCreate, topics: 'not-an-array' })
    expect(result.success).toBe(false)
  })

  it('rejects topics with too many entries', () => {
    const result = speakerCreateSchema.safeParse({
      ...validCreate,
      topics: Array.from({ length: 31 }, (_, i) => `t${i}`),
    })
    expect(result.success).toBe(false)
  })

  it('rejects feeMin as a string', () => {
    const result = speakerCreateSchema.safeParse({ ...validCreate, feeMin: '5000' })
    expect(result.success).toBe(false)
  })

  it('strips unknown fields silently', () => {
    const result = speakerCreateSchema.safeParse({ ...validCreate, evil: 'data' })
    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('evil')
  })

  it('accepts videoUrl as empty string or URL', () => {
    expect(speakerCreateSchema.safeParse({ ...validCreate, videoUrl: '' }).success).toBe(true)
    expect(speakerCreateSchema.safeParse({ ...validCreate, videoUrl: 'https://x.com/v.mp4' }).success).toBe(true)
    expect(speakerCreateSchema.safeParse({ ...validCreate, videoUrl: 'not-a-url' }).success).toBe(false)
  })
})

describe('speakerPatchSchema', () => {
  it('accepts an empty object', () => {
    expect(speakerPatchSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a single-field update', () => {
    expect(speakerPatchSchema.safeParse({ headline: 'New headline' }).success).toBe(true)
  })

  it('strips unknown fields silently', () => {
    const result = speakerPatchSchema.safeParse({ rogue: 'value' })
    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('rogue')
  })
})

describe('portalDraftSchema', () => {
  it('accepts speaker self-update with required fields', () => {
    expect(portalDraftSchema.safeParse({
      name: 'Self',
      headline: 'My headline',
      bio: 'My bio',
    }).success).toBe(true)
  })

  it('rejects feeMin (speakers cannot set their own fee)', () => {
    const result = portalDraftSchema.safeParse({
      name: 'Self',
      headline: 'My headline',
      bio: 'My bio',
      feeMin: 99999,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing bio', () => {
    const result = portalDraftSchema.safeParse({
      name: 'Self',
      headline: 'My headline',
    })
    expect(result.success).toBe(false)
  })
})
