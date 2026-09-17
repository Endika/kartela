import { describe, expect, it } from 'vitest'
import { isTrustedPosterSource } from '../tools/poster-source'

describe('isTrustedPosterSource', () => {
  it('accepts a Wikimedia upload URL', () => {
    expect(isTrustedPosterSource('https://upload.wikimedia.org/wikipedia/en/a/ab/Poster.jpg')).toBe(
      true,
    )
  })

  it('rejects a host outside wikimedia.org', () => {
    expect(isTrustedPosterSource('https://evil.example.com/poster.jpg')).toBe(false)
  })

  it('rejects a lookalike host', () => {
    expect(isTrustedPosterSource('https://upload.wikimedia.org.evil.com/poster.jpg')).toBe(false)
  })

  it('rejects a non-https scheme', () => {
    expect(isTrustedPosterSource('http://upload.wikimedia.org/poster.jpg')).toBe(false)
  })

  it('rejects a malformed URL', () => {
    expect(isTrustedPosterSource('not a url')).toBe(false)
  })
})
