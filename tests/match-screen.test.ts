import { beforeEach, describe, expect, it, vi } from 'vitest'
import { titleOf } from '../src/domain/film'
import { createMatch } from '../src/domain/match'
import { seededRandom } from '../src/adapters/seeded-random'
import { renderMatchScreen } from '../src/ui/match-screen'
import { FILMS, fakeDeps } from './support/fakes'

const deps = fakeDeps()

function mount(): HTMLDivElement {
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  return root
}

const matchOf = (size: number) => createMatch(FILMS.slice(0, size), seededRandom(1))

describe('match screen', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('shows both posters of the duel with their titles', () => {
    const root = mount()
    const match = matchOf(4)
    renderMatchScreen(root, deps, match, 'es', () => {})
    const images = [...root.querySelectorAll('img')]
    expect(images).toHaveLength(2)
    const duel = match.duel
    expect(images[0]?.alt).toBe(titleOf(duel!.left, 'es'))
    expect(images[1]?.alt).toBe(titleOf(duel!.right, 'es'))
    expect(root.textContent).toContain('Ronda 1 de 3')
  })

  it('builds poster URLs through the injected catalogue', () => {
    const root = mount()
    const match = matchOf(4)
    renderMatchScreen(root, deps, match, 'es', () => {})
    const src = root.querySelector('img')?.getAttribute('src') ?? ''
    expect(src).toBe(deps.catalogue.posterUrl(match.duel!.left))
  })

  it('picks the film on the side that was tapped', () => {
    const root = mount()
    const match = matchOf(4)
    renderMatchScreen(root, deps, match, 'es', () => {})
    const expected = match.duel?.right
    const cards = [...root.querySelectorAll('button[data-side]')] as HTMLButtonElement[]
    cards[1]?.click()
    expect(match.champion).toBe(expected)
  })

  it('picks with the arrow keys too', () => {
    const root = mount()
    const match = matchOf(4)
    renderMatchScreen(root, deps, match, 'es', () => {})
    const expected = match.duel?.left
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(match.champion).toBe(expected)
  })

  it('calls back once the deck runs out, after the card has flown off', () => {
    vi.useFakeTimers()
    try {
      const root = mount()
      const onFinish = vi.fn()
      const match = matchOf(2)
      renderMatchScreen(root, deps, match, 'es', onFinish)
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
      const match = matchOf(6)
      renderMatchScreen(root, deps, match, 'es', () => {})
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
    const match = matchOf(6)
    const teardown = renderMatchScreen(root, deps, match, 'es', () => {})
    teardown()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(match.history).toHaveLength(0)
  })

  it('speaks the language it is handed', () => {
    const root = mount()
    renderMatchScreen(root, deps, matchOf(4), 'eu', () => {})
    expect(root.textContent).toContain('Gehien gustatzen zaizunerantz mugitu hatza')
  })
})
