import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOG, title } from '../src/data/catalog'
import { createMatch, type Match } from '../src/core/match'
import { createRng } from '../src/core/rng'
import { setLang } from '../src/i18n'
import { renderResultsScreen } from '../src/app/results-screen'

function playedMatch(size = 8): Match {
  const match = createMatch(CATALOG.slice(0, size), createRng(4))
  while (!match.isOver) {
    match.choose('left')
  }
  return match
}

function mount(): HTMLDivElement {
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  return root
}

describe('results screen', () => {
  beforeEach(() => {
    setLang('es')
    document.body.replaceChildren()
  })

  it('lists every pick of the match', () => {
    const root = mount()
    const match = playedMatch(8)
    renderResultsScreen(
      root,
      match,
      'es',
      () => {},
      () => {},
    )
    expect(root.querySelectorAll('li')).toHaveLength(match.history.length)
    expect(match.history).toHaveLength(7)
  })

  it('puts the champion at the top', () => {
    const root = mount()
    const match = playedMatch(6)
    renderResultsScreen(
      root,
      match,
      'es',
      () => {},
      () => {},
    )
    const heading = root.querySelector('h2')
    expect(heading?.textContent).toContain(title(match.champion!, 'es'))
    const first = root.querySelector('li')
    expect(first?.textContent).toContain(title(match.champion!, 'es'))
  })

  it('names the loser of each duel under the winner', () => {
    const root = mount()
    const match = playedMatch(4)
    renderResultsScreen(
      root,
      match,
      'es',
      () => {},
      () => {},
    )
    const last = match.history[match.history.length - 1]
    const first = root.querySelector('li')
    expect(first?.textContent).toContain(title(last!.loser, 'es'))
  })

  it('offers another match and a way back to the options', () => {
    const root = mount()
    const onAgain = vi.fn()
    const onChange = vi.fn()
    renderResultsScreen(root, playedMatch(4), 'es', onAgain, onChange)
    const play = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Otra vez')
    const change = [...root.querySelectorAll('button')].find(
      (b) => b.textContent === 'Cambiar opciones',
    )
    play?.click()
    change?.click()
    expect(onAgain).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('survives a match that never had a duel', () => {
    const root = mount()
    const match = createMatch(CATALOG.slice(0, 1), createRng(1))
    renderResultsScreen(
      root,
      match,
      'es',
      () => {},
      () => {},
    )
    expect(root.querySelectorAll('li')).toHaveLength(0)
    expect(root.querySelector('h2')?.textContent).toContain(title(CATALOG[0]!, 'es'))
  })
})
