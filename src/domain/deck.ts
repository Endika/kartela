import type { Film } from './film'
import { DURATION_SIZES, type Options } from './options'
import type { Random } from './ports'
import { shuffle } from './shuffle'

export function eligible(catalogue: readonly Film[], options: Options): Film[] {
  return catalogue.filter(
    (film) =>
      options.categories.includes(film.category) &&
      (options.includeSequels || !film.sequel) &&
      (options.includeLiveAction || !film.liveAction),
  )
}

/** How many films a match with these options would actually play. */
export function deckSize(catalogue: readonly Film[], options: Options): number {
  const available = eligible(catalogue, options).length
  const limit = DURATION_SIZES[options.duration]
  return limit === null ? available : Math.min(available, limit)
}

/**
 * The films of one match, already in play order. A duration longer than the number of
 * eligible films just yields all of them rather than failing.
 */
export function buildDeck(catalogue: readonly Film[], options: Options, random: Random): Film[] {
  const pool = shuffle(eligible(catalogue, options), random)
  return pool.slice(0, deckSize(catalogue, options))
}
