import { beforeEach, describe, expect, it, vi } from 'vitest'
import { startApp } from '../src/main'
import { fakeDeps } from './support/fakes'

function boot(version = '9.9.9') {
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  startApp(host, fakeDeps(), version)
  return host
}

const footer = (host: HTMLElement): string => host.querySelector('footer')?.textContent ?? ''
const play = (host: HTMLElement): void => {
  const button = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Jugar')
  button?.click()
}

describe('app shell', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('shows the running version in the footer', () => {
    expect(footer(boot('1.2.3'))).toBe('Kartela v1.2.3')
  })

  it('keeps the footer through every screen change', () => {
    const host = boot()
    expect(footer(host)).toContain('9.9.9')
    play(host)
    expect(host.querySelector('button[data-side]')).toBeTruthy()
    expect(footer(host)).toContain('9.9.9')
  })

  it('never renders the footer twice', () => {
    const host = boot()
    play(host)
    expect(host.querySelectorAll('footer')).toHaveLength(1)
  })

  it('replays a harder round with only the films that held the screen', () => {
    vi.useFakeTimers()
    try {
      const host = boot()
      play(host)
      // Alternating hands the screen over now and then, so several films survive the match.
      let round = 0
      while (host.querySelector('button[data-side]')) {
        round += 1
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: round % 3 === 0 ? 'ArrowRight' : 'ArrowLeft' }),
        )
        vi.advanceTimersByTime(300)
      }
      const harder = [...host.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Duelo de favoritas'),
      )
      const picked = Number(/(\d+) películas/.exec(harder?.textContent ?? '')?.[1])
      expect(picked).toBeGreaterThanOrEqual(2)
      expect(picked).toBeLessThan(round)
      harder?.click()
      expect(host.querySelector('button[data-side]')).toBeTruthy()
      expect(host.querySelector('#round')?.textContent).toBe(`Ronda 1 de ${picked - 1}`)
    } finally {
      vi.useRealTimers()
    }
  })
})
