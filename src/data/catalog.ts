import raw from './catalog.json'

export const CATEGORIES = ['disney', 'pixar', 'dreamworks', 'live-action'] as const
export type Category = (typeof CATEGORIES)[number]

export const LANGS = ['en', 'es', 'eu', 'gl', 'ca', 'va'] as const
export type Lang = (typeof LANGS)[number]

export interface Film {
  id: string
  category: Category
  year: number
  sequel: boolean
  poster: string
  titles: Record<Lang, string>
}

export const CATALOG: readonly Film[] = raw as Film[]

export function posterUrl(film: Film): string {
  return `${import.meta.env.BASE_URL}posters/${film.poster}`
}

export function title(film: Film, lang: Lang): string {
  return film.titles[lang] || film.titles.en
}
