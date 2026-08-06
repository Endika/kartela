import { CATEGORIES, type Category } from '../data/catalog'
import { DURATIONS, type Duration } from '../core/deck'
import { detectLang, isLang } from '../i18n'
import type { Lang } from '../data/catalog'

const STORAGE_KEY = 'kartela.options'

export interface Options {
  categories: Category[]
  includeSequels: boolean
  duration: Duration
  lang: Lang
}

export function defaultOptions(): Options {
  return {
    categories: [...CATEGORIES],
    includeSequels: true,
    duration: 'short',
    lang: detectLang(),
  }
}

/** Anything unrecognised in storage falls back to the default rather than breaking the app. */
export function loadOptions(store: Pick<Storage, 'getItem'> = localStorage): Options {
  const fallback = defaultOptions()
  let raw: unknown
  try {
    raw = JSON.parse(store.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return fallback
  }
  if (typeof raw !== 'object' || raw === null) {
    return fallback
  }
  const saved = raw as Partial<Record<keyof Options, unknown>>
  const categories = Array.isArray(saved.categories)
    ? saved.categories.filter((value): value is Category =>
        (CATEGORIES as readonly unknown[]).includes(value),
      )
    : fallback.categories
  return {
    categories: categories.length > 0 ? categories : fallback.categories,
    includeSequels:
      typeof saved.includeSequels === 'boolean' ? saved.includeSequels : fallback.includeSequels,
    duration: (DURATIONS as readonly unknown[]).includes(saved.duration)
      ? (saved.duration as Duration)
      : fallback.duration,
    lang: typeof saved.lang === 'string' && isLang(saved.lang) ? saved.lang : fallback.lang,
  }
}

export function saveOptions(
  options: Options,
  store: Pick<Storage, 'setItem'> = localStorage,
): void {
  store.setItem(STORAGE_KEY, JSON.stringify(options))
}
