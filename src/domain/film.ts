export const CATEGORIES = ['disney', 'pixar', 'dreamworks', 'live-action'] as const
export type Category = (typeof CATEGORIES)[number]

export const LANGS = ['en', 'es', 'eu', 'gl', 'ca', 'va'] as const
export type Lang = (typeof LANGS)[number]

export interface Film {
  id: string
  category: Category
  year: number
  sequel: boolean
  /** File name of the poster; turning it into a URL is the catalogue adapter's job. */
  poster: string
  titles: Record<Lang, string>
}

export function titleOf(film: Film, lang: Lang): string {
  return film.titles[lang] || film.titles.en
}

export function isCategory(value: unknown): value is Category {
  return (CATEGORIES as readonly unknown[]).includes(value)
}

export function isLang(value: unknown): value is Lang {
  return (LANGS as readonly unknown[]).includes(value)
}
