/**
 * The poster URL comes from Wikipedia's own response (`originalimage`/`thumbnail`), not
 * from the curated seed, so it is untrusted: only follow it if it actually points at
 * Wikimedia's media host.
 */
export function isTrustedPosterSource(source: string): boolean {
  let url: URL
  try {
    url = new URL(source)
  } catch {
    return false
  }
  return (
    url.protocol === 'https:' &&
    (url.hostname === 'wikimedia.org' || url.hostname.endsWith('.wikimedia.org'))
  )
}
