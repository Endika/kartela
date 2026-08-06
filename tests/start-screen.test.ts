import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOG } from '../src/data/catalog'
import { eligible } from '../src/core/deck'
import { setLang } from '../src/i18n'
import { deckSize, renderStartScreen } from '../src/app/start-screen'
import { defaultOptions, loadOptions, type Options } from '../src/app/options'

const spanish = (): Options => ({ ...defaultOptions(), lang: 'es' })

function mount(options: Options = spanish(), onPlay = vi.fn()) {
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  renderStartScreen(root, options, onPlay)
  return { root, onPlay }
}

const buttons = (root: HTMLElement): HTMLButtonElement[] =>
  [...root.querySelectorAll('button')] as HTMLButtonElement[]

const byText = (root: HTMLElement, text: string): HTMLButtonElement => {
  const found = buttons(root).find((button) => button.textContent === text)
  if (!found) {
    throw new Error(
      `no button labelled "${text}" — found: ${buttons(root)
        .map((b) => b.textContent)
        .join(', ')}`,
    )
  }
  return found
}

const deckLabel = (root: HTMLElement): string => root.querySelector('#deck-size')?.textContent ?? ''

describe('start screen', () => {
  beforeEach(() => {
    localStorage.clear()
    setLang('es')
  })

  it('offers the four studios, the sequels switch and the three lengths', () => {
    const { root } = mount()
    for (const label of [
      'Clásicos Disney',
      'Pixar',
      'DreamWorks',
      'Disney en imagen real',
      'Incluir secuelas',
      'Corta',
      'Media',
      'Todo',
      'Jugar',
    ]) {
      expect(byText(root, label), label).toBeTruthy()
    }
  })

  it('shows how many films the current options would play', () => {
    const { root } = mount()
    expect(deckLabel(root)).toBe('12 películas')
  })

  it('shrinks the count when a studio is switched off', () => {
    const { root } = mount({ ...spanish(), duration: 'full' })
    const before = deckLabel(root)
    byText(root, 'Pixar').click()
    expect(deckLabel(root)).not.toBe(before)
    expect(byText(root, 'Pixar').getAttribute('aria-pressed')).toBe('false')
  })

  it('counts only the eligible films when sequels are off', () => {
    const options: Options = { ...spanish(), duration: 'full', includeSequels: false }
    const { root } = mount(options)
    const expected = eligible(CATALOG, options).length
    expect(deckLabel(root)).toBe(`${expected} películas`)
    expect(expected).toBeLessThan(CATALOG.length)
  })

  it('refuses to play with no studio selected and says why', () => {
    const { root } = mount({ ...spanish(), categories: ['pixar'] })
    byText(root, 'Pixar').click()
    expect(byText(root, 'Jugar').disabled).toBe(true)
    expect(deckLabel(root)).toBe('Elige al menos un estudio')
  })

  it('never asks for more films than the studios can give', () => {
    const options: Options = {
      ...spanish(),
      categories: ['pixar'],
      includeSequels: false,
      duration: 'full',
    }
    expect(deckSize(options)).toBe(eligible(CATALOG, options).length)
  })

  it('hands the chosen options to the play callback', () => {
    const onPlay = vi.fn()
    const { root } = mount(spanish(), onPlay)
    byText(root, 'Todo').click()
    byText(root, 'Incluir secuelas').click()
    byText(root, 'Jugar').click()
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPlay.mock.calls[0]?.[0]).toMatchObject({ duration: 'full', includeSequels: false })
  })

  it('remembers the options for the next visit', () => {
    const { root } = mount()
    byText(root, 'Media').click()
    byText(root, 'DreamWorks').click()
    const saved = loadOptions()
    expect(saved.duration).toBe('medium')
    expect(saved.categories).not.toContain('dreamworks')
  })

  it('redraws in the language picked from the selector', () => {
    const { root } = mount()
    const select = root.querySelector('select') as HTMLSelectElement
    select.value = 'eu'
    select.dispatchEvent(new Event('change'))
    expect(byText(root, 'Jolastu')).toBeTruthy()
  })
})
