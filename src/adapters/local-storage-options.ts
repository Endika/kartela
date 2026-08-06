import { isCategory, isLang, type Category } from '../domain/film'
import { defaultOptions, isDuration, type Options } from '../domain/options'
import type { OptionsStore, Translations } from '../domain/ports'

const STORAGE_KEY = 'kartela.options'

/**
 * Options kept in web storage. Anything unrecognised in there falls back to the default
 * rather than breaking the app, so a stale or hand-edited blob cannot brick the game.
 */
export function storedOptions(
  translations: Translations,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): OptionsStore {
  return {
    load(): Options {
      const fallback = defaultOptions(translations.preferred())
      let parsed: unknown
      try {
        parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null')
      } catch {
        return fallback
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return fallback
      }
      const saved = parsed as Partial<Record<keyof Options, unknown>>
      const categories = Array.isArray(saved.categories)
        ? saved.categories.filter((value): value is Category => isCategory(value))
        : []
      return {
        categories: categories.length > 0 ? categories : fallback.categories,
        includeSequels:
          typeof saved.includeSequels === 'boolean'
            ? saved.includeSequels
            : fallback.includeSequels,
        includeLiveAction:
          typeof saved.includeLiveAction === 'boolean'
            ? saved.includeLiveAction
            : fallback.includeLiveAction,
        duration: isDuration(saved.duration) ? saved.duration : fallback.duration,
        lang: isLang(saved.lang) ? saved.lang : fallback.lang,
      }
    },
    save(options: Options): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(options))
    },
  }
}
