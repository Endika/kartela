import { describe, expect, it } from 'vitest'
import { defaultOptions, loadOptions, saveOptions } from '../src/app/options'

function store(initial: string | null) {
  let value = initial
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
    read: () => value,
  }
}

describe('options', () => {
  it('starts with every studio, sequels on and a short match', () => {
    const options = defaultOptions()
    expect(options.categories).toEqual(['disney', 'pixar', 'dreamworks', 'live-action'])
    expect(options.includeSequels).toBe(true)
    expect(options.duration).toBe('short')
  })

  it('round-trips through storage', () => {
    const target = store(null)
    saveOptions(
      { categories: ['pixar'], includeSequels: false, duration: 'full', lang: 'eu' },
      target,
    )
    expect(loadOptions(target)).toEqual({
      categories: ['pixar'],
      includeSequels: false,
      duration: 'full',
      lang: 'eu',
    })
  })

  it('falls back to the defaults when storage holds junk', () => {
    expect(loadOptions(store('not json'))).toEqual(defaultOptions())
    expect(loadOptions(store('null'))).toEqual(defaultOptions())
    expect(loadOptions(store('[]'))).toEqual(defaultOptions())
  })

  it('drops categories, durations and languages it does not know', () => {
    const saved = JSON.stringify({
      categories: ['pixar', 'marvel'],
      duration: 'forever',
      lang: 'de',
      includeSequels: 'yes',
    })
    const options = loadOptions(store(saved))
    expect(options.categories).toEqual(['pixar'])
    expect(options.duration).toBe('short')
    expect(options.lang).toBe('en')
    expect(options.includeSequels).toBe(true)
  })

  it('refuses to load an empty studio list', () => {
    const options = loadOptions(store(JSON.stringify({ categories: [] })))
    expect(options.categories).toEqual(defaultOptions().categories)
  })
})
