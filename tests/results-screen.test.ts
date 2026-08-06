import { beforeEach, describe, expect, it, vi } from 'vitest'
import { titleOf } from '../src/domain/film'
import { championRuns, createMatch, type Match } from '../src/domain/match'
import { renderResultsScreen } from '../src/ui/results-screen'
import { FILMS, fakeDeps } from './support/fakes'

const deps = fakeDeps()

/** Alternates sides so the match has several champions, not one that wins everything. */
function playedMatch(size = 8): Match {
  const match = createMatch(FILMS.slice(0, size))
  let round = 0
  while (!match.isOver) {
    round += 1
    match.choose(round % 3 === 0 ? 'right' : 'left')
  }
  return match
}

const picksList = (root: HTMLElement): HTMLElement =>
  root.querySelector('section > ol') as HTMLElement

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
    expect(picksList(root).querySelectorAll('li')).toHaveLength(runs.length)
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
    expect(picksList(root).querySelector('li')?.textContent).toContain(
      titleOf(match.champion!, 'es'),
    )
  })

  it('names what the newest champion beat, in the top entry', () => {
    const root = mount()
    const match = playedMatch(4)
    render(root, match)
    const last = match.history[match.history.length - 1]
    const first = picksList(root).querySelector('li')
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
    render(root, createMatch(FILMS.slice(0, 1)))
    expect(picksList(root).querySelectorAll('li')).toHaveLength(0)
    expect(root.querySelector('h2')?.textContent).toContain(titleOf(FILMS[0]!, 'es'))
  })

  it('lists every single duel in the full history, oldest first', () => {
    const root = mount()
    const match = playedMatch(8)
    render(root, match)
    const details = root.querySelector('details')
    expect(details?.querySelector('summary')?.textContent).toBe('Todos los duelos (7)')
    const rows = [...(details?.querySelectorAll('li') ?? [])]
    expect(rows).toHaveLength(match.history.length)
    match.history.forEach((choice, index) => {
      const row = rows[index]?.textContent ?? ''
      expect(row).toContain(titleOf(choice.winner, 'es'))
      expect(row).toContain(titleOf(choice.loser, 'es'))
      expect(row.startsWith(String(index + 1))).toBe(true)
    })
  })

  it('shows what knocked each film out, struck through', () => {
    const root = mount()
    const match = playedMatch(5)
    render(root, match)
    const struck = [...root.querySelectorAll('details .line-through')].map((n) => n.textContent)
    expect(struck).toEqual(match.history.map((choice) => titleOf(choice.loser, 'es')))
  })

  it('keeps the duel history collapsed until asked for', () => {
    const root = mount()
    render(root, playedMatch(5))
    expect(root.querySelector('details')?.hasAttribute('open')).toBe(false)
  })
})
