import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOG, title } from '../src/data/catalog'
import { createMatch } from '../src/core/match'
import { createRng } from '../src/core/rng'
import { setLang } from '../src/i18n'
import { renderMatchScreen } from '../src/app/match-screen'

function mount(): HTMLDivElement {
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  return root
}

describe('match screen', () => {
  beforeEach(() => {
    setLang('es')
    document.body.replaceChildren()
  })

  it('shows both posters of the duel with their titles', () => {
    const root = mount()
    const match = createMatch(CATALOG.slice(0, 4), createRng(1))
    renderMatchScreen(root, match, 'es', () => {})
    const images = [...root.querySelectorAll('img')]
    expect(images).toHaveLength(2)
    const duel = match.duel
    expect(images[0]?.alt).toBe(title(duel!.left, 'es'))
    expect(images[1]?.alt).toBe(title(duel!.right, 'es'))
    expect(root.textContent).toContain('Ronda 1 de 3')
  })

  it('picks the film on the side that was tapped', () => {
    const root = mount()
    const match = createMatch(CATALOG.slice(0, 4), createRng(1))
    renderMatchScreen(root, match, 'es', () => {})
    const expected = match.duel?.right
    const cards = [...root.querySelectorAll('button[data-side]')] as HTMLButtonElement[]
    cards[1]?.click()
    expect(match.champion).toBe(expected)
  })

  it('picks with the arrow keys too', () => {
    const root = mount()
    const match = createMatch(CATALOG.slice(0, 4), createRng(1))
    renderMatchScreen(root, match, 'es', () => {})
    const expected = match.duel?.left
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(match.champion).toBe(expected)
  })

  it('calls back once the deck runs out, after the card has flown off', () => {
    vi.useFakeTimers()
    try {
      const root = mount()
      const onFinish = vi.fn()
      const match = createMatch(CATALOG.slice(0, 2), createRng(1))
      renderMatchScreen(root, match, 'es', onFinish)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      expect(onFinish).not.toHaveBeenCalled()
      vi.advanceTimersByTime(300)
      expect(onFinish).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores a second pick while the animation is still running', () => {
    vi.useFakeTimers()
    try {
      const root = mount()
      const match = createMatch(CATALOG.slice(0, 6), createRng(1))
      renderMatchScreen(root, match, 'es', () => {})
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      expect(match.history).toHaveLength(1)
      vi.advanceTimersByTime(300)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      expect(match.history).toHaveLength(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops answering the keyboard after teardown', () => {
    const root = mount()
    const match = createMatch(CATALOG.slice(0, 6), createRng(1))
    const teardown = renderMatchScreen(root, match, 'es', () => {})
    teardown()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(match.history).toHaveLength(0)
  })
})
