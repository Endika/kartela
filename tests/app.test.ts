import { beforeEach, describe, expect, it } from 'vitest'
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
})
