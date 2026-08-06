import { el } from './dom'

/**
 * Sits below every screen for one reason: when a PWA might be serving a stale cache, you
 * need the page itself to tell you which build you are looking at.
 */
export function renderFooter(version: string): HTMLElement {
  const footer = el('footer', { class: 'pb-4 text-center text-xs text-white/55' })
  footer.textContent = `Kartela v${version}`
  return footer
}
