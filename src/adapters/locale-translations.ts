import { isLang, type Lang } from '../domain/film'
import type { Dict, TranslationKey, Translations, Translator } from '../domain/ports'
import { ca } from './locales/ca'
import { en } from './locales/en'
import { es } from './locales/es'
import { eu } from './locales/eu'
import { gl } from './locales/gl'
import { va } from './locales/va'

export const LOCALES: Record<Lang, Dict> = { en, es, eu, gl, ca, va }

export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  eu: 'Euskara',
  gl: 'Galego',
  ca: 'Català',
  va: 'Valencià',
}

function translator(lang: Lang): Translator {
  const dict = LOCALES[lang]
  return {
    lang,
    t(key: TranslationKey, params: Record<string, string | number> = {}): string {
      return dict[key].replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = params[name]
        return value === undefined ? match : String(value)
      })
    },
  }
}

export function localeTranslations(
  navigatorLike: { language?: string } = typeof navigator === 'undefined' ? {} : navigator,
): Translations {
  return {
    for: translator,
    preferred(): Lang {
      const code = (navigatorLike.language ?? 'en').slice(0, 2).toLowerCase()
      return isLang(code) ? code : 'en'
    },
    name: (lang) => LANG_NAMES[lang],
  }
}
