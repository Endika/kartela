import { beforeEach, describe, expect, it, vi } from 'vitest'
import { titleOf } from '../src/domain/film'
import { championRuns, createMatch, type Match } from '../src/domain/match'
import { seededRandom } from '../src/adapters/seeded-random'
import { renderResultsScreen } from '../src/ui/results-screen'
import { FILMS, fakeDeps } from './support/fakes'

const deps = fakeDeps()

function playedMatch(size = 8): Match {
  const match = createMatch(FILMS.slice(0, size), seededRandom(4))
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

const render = (root: HTMLElement, match: Match, onAgain = vi.fn(), onChange = vi.fn()) =>
  renderResultsScreen(root, deps, match, 'es', onAgain, onChange)

describe('results screen', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('lists every pick of the match, grouped by champion', () => {
    const root = mount()
    const match = playedMatch(8)
    render(root, match)
    const runs = championRuns(match.history)
    expect(match.history).toHaveLength(7)
    expect(root.querySelectorAll('li')).toHaveLength(runs.length)
    // Nothing is lost by grouping: every beaten film is still named.
    const shown = root.textContent ?? ''
    for (const choice of match.history) {
      expect(shown).toContain(titleOf(choice.loser, 'es'))
    }
  })

  it('puts the champion at the top', () => {
    const root = mount()
    const match = playedMatch(6)
    render(root, match)
    expect(root.querySelector('h2')?.textContent).toContain(titleOf(match.champion!, 'es'))
    expect(root.querySelector('li')?.textContent).toContain(titleOf(match.champion!, 'es'))
  })

  it('names what the newest champion beat, in the top entry', () => {
    const root = mount()
    const match = playedMatch(4)
    render(root, match)
    const last = match.history[match.history.length - 1]
    const first = root.querySelector('li')
    expect(first?.textContent).toContain(titleOf(last!.loser, 'es'))
    expect(first?.textContent).toContain('Gana a')
  })

  it('offers another match and a way back to the options', () => {
    const root = mount()
    const onAgain = vi.fn()
    const onChange = vi.fn()
    render(root, playedMatch(4), onAgain, onChange)
    const buttons = [...root.querySelectorAll('button')]
    buttons.find((b) => b.textContent === 'Otra vez')?.click()
    buttons.find((b) => b.textContent === 'Cambiar opciones')?.click()
    expect(onAgain).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('survives a match that never had a duel', () => {
    const root = mount()
    render(root, createMatch(FILMS.slice(0, 1), seededRandom(1)))
    expect(root.querySelectorAll('li')).toHaveLength(0)
    expect(root.querySelector('h2')?.textContent).toContain(titleOf(FILMS[0]!, 'es'))
  })
})
