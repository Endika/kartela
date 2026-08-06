import type { Category } from '../domain/film'
import type { TranslationKey } from '../domain/ports'

/**
 * One hue per studio. The colour lives in a thin frame and a small tab — never behind the
 * poster — because 189 posters already bring their own palettes and would fight it.
 *
 * A live-action remake wears its studio's colour like any other film: it is a Disney film
 * that happens not to be animated, not a studio of its own.
 *
 * Class names are spelled out rather than built from the hue so Tailwind can find them.
 */
export interface StudioLook {
  /** Long label, for the start-screen chip. */
  label: TranslationKey
  /** Short label, for the tab on top of a card. */
  tab: TranslationKey
  frame: string
  chipOn: string
  tabFill: string
}

export const STUDIOS: Record<Category, StudioLook> = {
  disney: {
    label: 'disney',
    tab: 'tabDisney',
    frame: 'ring-disney',
    chipOn: 'bg-disney/15 text-disney ring-disney',
    tabFill: 'bg-disney text-stage',
  },
  pixar: {
    label: 'pixar',
    tab: 'tabPixar',
    frame: 'ring-pixar',
    chipOn: 'bg-pixar/15 text-pixar ring-pixar',
    tabFill: 'bg-pixar text-stage',
  },
  dreamworks: {
    label: 'dreamworks',
    tab: 'tabDreamworks',
    frame: 'ring-dreamworks',
    chipOn: 'bg-dreamworks/15 text-dreamworks ring-dreamworks',
    tabFill: 'bg-dreamworks text-stage',
  },
}
