import type { Lang } from '../data/catalog'
import { LANGS } from '../data/catalog'
import { ca } from './locales/ca'
import { en, type Dict } from './locales/en'
import { es } from './locales/es'
import { eu } from './locales/eu'
import { gl } from './locales/gl'
import { va } from './locales/va'

export type { Dict }
export { LANGS }

export const LOCALES: Record<Lang, Dict> = { en, es, eu, gl, ca, va }

export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  eu: 'Euskara',
  gl: 'Galego',
  ca: 'Català',
  va: 'Valencià',
}

export function isLang(code: string): code is Lang {
  return (LANGS as readonly string[]).includes(code)
}

export function detectLang(nav: { language?: string } = navigator): Lang {
  const code = (nav.language ?? 'en').slice(0, 2).toLowerCase()
  return isLang(code) ? code : 'en'
}

let current: Lang = 'en'

export function setLang(lang: Lang): void {
  current = lang
}

export function currentLang(): Lang {
  return current
}

export function t(key: keyof Dict, params: Record<string, string | number> = {}): string {
  const template = LOCALES[current][key]
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}
