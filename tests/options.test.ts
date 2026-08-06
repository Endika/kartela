import { describe, expect, it } from 'vitest'
import { localeTranslations } from '../src/adapters/locale-translations'
import { storedOptions } from '../src/adapters/local-storage-options'
import { defaultOptions } from '../src/domain/options'
import { memoryStorage } from './support/fakes'

const translations = localeTranslations({ language: 'es' })
const store = (initial?: string) =>
  storedOptions(
    translations,
    memoryStorage(initial === undefined ? {} : { 'kartela.options': initial }),
  )

describe('stored options', () => {
  it('starts with every studio, sequels on and a short match', () => {
    const options = store().load()
    expect(options.categories).toEqual(['disney', 'pixar', 'dreamworks'])
    expect(options.includeSequels).toBe(true)
    expect(options.includeLiveAction).toBe(true)
    expect(options.duration).toBe('short')
  })

  it('opens in the language the environment prefers', () => {
    expect(store().load().lang).toBe('es')
    expect(storedOptions(localeTranslations({ language: 'eu' }), memoryStorage()).load().lang).toBe(
      'eu',
    )
  })

  it('round-trips through storage', () => {
    const storage = memoryStorage()
    const target = storedOptions(translations, storage)
    target.save({
      categories: ['pixar'],
      includeSequels: false,
      includeLiveAction: false,
      duration: 'full',
      lang: 'eu',
    })
    expect(target.load()).toEqual({
      categories: ['pixar'],
      includeSequels: false,
      includeLiveAction: false,
      duration: 'full',
      lang: 'eu',
    })
  })

  it('falls back to the defaults when storage holds junk', () => {
    expect(store('not json').load()).toEqual(defaultOptions('es'))
    expect(store('null').load()).toEqual(defaultOptions('es'))
    expect(store('[]').load()).toEqual(defaultOptions('es'))
  })

  it('drops categories, durations and languages it does not know', () => {
    const options = store(
      JSON.stringify({
        categories: ['pixar', 'marvel'],
        duration: 'forever',
        lang: 'de',
        includeSequels: 'yes',
      }),
    ).load()
    expect(options.categories).toEqual(['pixar'])
    expect(options.duration).toBe('short')
    expect(options.lang).toBe('es')
    expect(options.includeSequels).toBe(true)
    expect(options.includeLiveAction).toBe(true)
  })

  it('refuses to load an empty studio list', () => {
    const options = store(JSON.stringify({ categories: [] })).load()
    expect(options.categories).toEqual(defaultOptions('es').categories)
  })
})
