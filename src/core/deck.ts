import type { Category, Film } from '../data/catalog'
import { shuffle, type Rng } from './rng'

export const DURATIONS = ['short', 'medium', 'full'] as const
export type Duration = (typeof DURATIONS)[number]

export const DURATION_SIZES: Record<Duration, number | null> = {
  short: 12,
  medium: 24,
  full: null,
}

export interface DeckOptions {
  categories: readonly Category[]
  includeSequels: boolean
  duration: Duration
}

export function eligible(catalog: readonly Film[], options: DeckOptions): Film[] {
  return catalog.filter(
    (film) =>
      options.categories.includes(film.category) && (options.includeSequels || !film.sequel),
  )
}

/**
 * The films of one match, already in play order. A duration longer than the number of
 * eligible films just yields all of them rather than failing.
 */
export function buildDeck(catalog: readonly Film[], options: DeckOptions, rng: Rng): Film[] {
  const pool = shuffle(eligible(catalog, options), rng)
  const size = DURATION_SIZES[options.duration]
  return size === null ? pool : pool.slice(0, size)
}
