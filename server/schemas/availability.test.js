import { describe, it, expect } from 'vitest'
import { availabilitySaveSchema } from './availability.js'

describe('availabilitySaveSchema', () => {
  it('accepts an empty blocked array', () => {
    const r = availabilitySaveSchema.safeParse({ blocked: [] })
    expect(r.success).toBe(true)
  })

  it('accepts well-formed YYYY-MM-DD dates', () => {
    const r = availabilitySaveSchema.safeParse({
      blocked: ['2030-01-01', '2030-12-31'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects malformed dates', () => {
    const r = availabilitySaveSchema.safeParse({ blocked: ['2030/01/01'] })
    expect(r.success).toBe(false)
  })

  it('rejects more than 366 entries', () => {
    const dates = Array.from({ length: 367 }, (_, i) => {
      const d = new Date(2030, 0, 1 + i).toISOString().slice(0, 10)
      return d
    })
    const r = availabilitySaveSchema.safeParse({ blocked: dates })
    expect(r.success).toBe(false)
  })

  it('rejects non-string entries', () => {
    const r = availabilitySaveSchema.safeParse({ blocked: [123] })
    expect(r.success).toBe(false)
  })
})
