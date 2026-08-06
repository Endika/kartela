import raw from '../data/catalog.json'
import type { Film } from '../domain/film'
import type { FilmCatalogue } from '../domain/ports'

/** The catalogue that ships inside the bundle — no network, no runtime fetching. */
export function bundledCatalogue(base: string = import.meta.env.BASE_URL): FilmCatalogue {
  const films = raw as Film[]
  return {
    all: () => films,
    posterUrl: (film) => `${base}posters/${film.poster}`,
  }
}
