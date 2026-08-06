import type { FilmCatalogue, OptionsStore, Random, Translations } from '../domain/ports'

/**
 * Everything the screens reach for, handed to them instead of imported. main.ts is the only
 * place that decides which implementation each one is.
 */
export interface Deps {
  catalogue: FilmCatalogue
  options: OptionsStore
  translations: Translations
  random: Random
}
