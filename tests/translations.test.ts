import { describe, expect, it } from 'vitest'
import { LANGS } from '../src/domain/film'
import { TRANSLATION_KEYS } from '../src/domain/ports'
import { LANG_NAMES, LOCALES, localeTranslations } from '../src/adapters/locale-translations'

const translations = localeTranslations({ language: 'en' })

describe('locale translations', () => {
  it('translates every key the port declares, in every language', () => {
    for (const lang of LANGS) {
      const missing = TRANSLATION_KEYS.filter((key) => !LOCALES[lang][key]?.trim())
      expect(missing, lang).toEqual([])
    }
  })

  it('carries no key the port does not declare', () => {
    const declared = new Set<string>(TRANSLATION_KEYS)
    for (const lang of LANGS) {
      const extra = Object.keys(LOCALES[lang]).filter((key) => !declared.has(key))
      expect(extra, lang).toEqual([])
    }
  })

  it('names every language for the picker', () => {
    for (const lang of LANGS) {
      expect(LANG_NAMES[lang]?.length, lang).toBeGreaterThan(0)
    }
  })

  it('fills in placeholders', () => {
    const es = translations.for('es')
    expect(es.t('round', { n: 3, total: 11 })).toBe('Ronda 3 de 11')
    expect(es.t('films', { n: 24 })).toBe('24 películas')
  })

  it('leaves an unknown placeholder untouched rather than printing undefined', () => {
    expect(translations.for('en').t('round', { n: 2 })).toBe('Round 2 of {total}')
  })

  it('hands out an independent translator per language', () => {
    const es = translations.for('es')
    const eu = translations.for('eu')
    expect(es.lang).toBe('es')
    expect(eu.lang).toBe('eu')
    expect(es.t('play')).toBe('Jugar')
    expect(eu.t('play')).toBe('Jolastu')
  })

  it('prefers the language the environment asks for, falling back to English', () => {
    expect(localeTranslations({ language: 'es-ES' }).preferred()).toBe('es')
    expect(localeTranslations({ language: 'eu' }).preferred()).toBe('eu')
    expect(localeTranslations({ language: 'de-DE' }).preferred()).toBe('en')
    expect(localeTranslations({}).preferred()).toBe('en')
  })
})
