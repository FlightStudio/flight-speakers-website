import { describe, it, expect } from 'vitest'

import { _internal } from './claude.js'

describe('buildSpeakerSummaries', () => {
  it('omits the Internal Notes line when boostNotes is empty', () => {
    const out = _internal.buildSpeakerSummaries([
      { id: 's1', name: 'Test', headline: 'h', bio: 'b', topics: ['t'] },
    ])
    expect(out).not.toContain('Internal Notes')
  })

  it('includes the Internal Notes line when boostNotes is present', () => {
    const out = _internal.buildSpeakerSummaries([
      {
        id: 's1', name: 'Test', headline: 'h', bio: 'b', topics: ['t'],
        boostNotes: 'Has delivered 3 health-focused keynotes',
      },
    ])
    expect(out).toContain('Internal Notes (for AI consideration): Has delivered 3 health-focused keynotes')
  })

  it('trims whitespace from boostNotes', () => {
    const out = _internal.buildSpeakerSummaries([
      {
        id: 's1', name: 'Test', headline: 'h', bio: 'b', topics: ['t'],
        boostNotes: '   leading and trailing   ',
      },
    ])
    expect(out).toContain('Internal Notes (for AI consideration): leading and trailing')
  })
})
