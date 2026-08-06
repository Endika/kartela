import type { Film, Lang } from './film'
import type { Options } from './options'

/** Where the films come from. Implemented by the bundled catalogue, faked in tests. */
export interface FilmCatalogue {
  all(): readonly Film[]
  posterUrl(film: Film): string
}

/** Where the player's choices survive a reload. */
export interface OptionsStore {
  load(): Options
  save(options: Options): void
}

/** Anything that yields a number in [0, 1). Seeded in tests, Math.random in the browser. */
export type Random = () => number

/**
 * The UI copy contract. The port owns the key list so a locale file has to satisfy it,
 * rather than one locale accidentally defining what the others must match.
 */
export const TRANSLATION_KEYS = [
  'tagline',
  'studios',
  'disney',
  'pixar',
  'dreamworks',
  'liveAction',
  'includeSequels',
  'howLong',
  'short',
  'medium',
  'full',
  'films',
  'play',
  'pickAStudio',
  'notEnoughFilms',
  'language',
  'round',
  'swipeHint',
  'favourite',
  'beats',
  'yourPicks',
  'playAgain',
  'change',
] as const

export type TranslationKey = (typeof TRANSLATION_KEYS)[number]
export type Dict = Record<TranslationKey, string>

/** Translations for one language. Immutable: switching language means a new Translator. */
export interface Translator {
  readonly lang: Lang
  t(key: TranslationKey, params?: Record<string, string | number>): string
}

export interface Translations {
  for(lang: Lang): Translator
  /** The language to open with, given what the environment says it prefers. */
  preferred(): Lang
  /** How a language calls itself, for the picker. */
  name(lang: Lang): string
}
