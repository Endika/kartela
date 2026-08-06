import { CATEGORIES, type Category, type Lang } from './film'

export const DURATIONS = ['short', 'medium', 'full'] as const
export type Duration = (typeof DURATIONS)[number]

/** null means "no limit": play every eligible film. */
export const DURATION_SIZES: Record<Duration, number | null> = {
  short: 12,
  medium: 24,
  full: null,
}

export interface Options {
  readonly categories: readonly Category[]
  includeSequels: boolean
  includeLiveAction: boolean
  duration: Duration
  lang: Lang
}

export function defaultOptions(lang: Lang): Options {
  return {
    categories: [...CATEGORIES],
    includeSequels: true,
    includeLiveAction: true,
    duration: 'short',
    lang,
  }
}

export function isDuration(value: unknown): value is Duration {
  return (DURATIONS as readonly unknown[]).includes(value)
}
