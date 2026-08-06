import { bundledCatalogue } from '../../src/adapters/bundled-catalogue'
import { localeTranslations } from '../../src/adapters/locale-translations'
import { storedOptions } from '../../src/adapters/local-storage-options'
import { seededRandom } from '../../src/adapters/seeded-random'
import type { Film } from '../../src/domain/film'
import type { FilmCatalogue } from '../../src/domain/ports'
import type { Deps } from '../../src/ui/deps'

/** The real bundled catalogue, with a fixed base so poster URLs are predictable. */
export const CATALOGUE = bundledCatalogue('/')
export const FILMS = CATALOGUE.all()

export function catalogueOf(films: readonly Film[]): FilmCatalogue {
  return { all: () => films, posterUrl: (film) => `/posters/${film.poster}` }
}

/** Web storage without a browser: same contract, nothing shared between tests. */
export function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    read: () => Object.fromEntries(data),
  }
}

export function fakeDeps(overrides: Partial<Deps> = {}): Deps {
  const translations = overrides.translations ?? localeTranslations({ language: 'es' })
  return {
    catalogue: CATALOGUE,
    options: storedOptions(translations, memoryStorage()),
    translations,
    random: seededRandom(1),
    ...overrides,
  }
}
