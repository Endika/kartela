import { describe, expect, it } from 'vitest'
import { LANGS } from '../src/data/catalog'
import { detectLang, LANG_NAMES, LOCALES, setLang, t } from '../src/i18n'
import { en } from '../src/i18n/locales/en'

describe('i18n', () => {
  it('translates every key in every language', () => {
    const keys = Object.keys(en) as (keyof typeof en)[]
    for (const lang of LANGS) {
      const missing = keys.filter((key) => !LOCALES[lang][key]?.trim())
      expect(missing, lang).toEqual([])
    }
  })

  it('adds no keys a language does not share with English', () => {
    const keys = new Set(Object.keys(en))
    for (const lang of LANGS) {
      const extra = Object.keys(LOCALES[lang]).filter((key) => !keys.has(key))
      expect(extra, lang).toEqual([])
    }
  })

  it('names every language for the picker', () => {
    for (const lang of LANGS) {
      expect(LANG_NAMES[lang]?.length, lang).toBeGreaterThan(0)
    }
  })

  it('fills in placeholders', () => {
    setLang('es')
    expect(t('round', { n: 3, total: 11 })).toBe('Ronda 3 de 11')
    expect(t('films', { n: 24 })).toBe('24 películas')
  })

  it('leaves an unknown placeholder untouched rather than printing undefined', () => {
    setLang('en')
    expect(t('round', { n: 2 })).toBe('Round 2 of {total}')
  })

  it('detects a supported browser language and falls back to English', () => {
    expect(detectLang({ language: 'es-ES' })).toBe('es')
    expect(detectLang({ language: 'eu' })).toBe('eu')
    expect(detectLang({ language: 'de-DE' })).toBe('en')
    expect(detectLang({})).toBe('en')
  })
})
