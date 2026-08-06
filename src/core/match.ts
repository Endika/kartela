import type { Film } from '../data/catalog'
import type { Rng } from './rng'

export const SIDES = ['left', 'right'] as const
export type Side = (typeof SIDES)[number]

export interface Duel {
  left: Film
  right: Film
}

export interface Choice {
  winner: Film
  loser: Film
}

export interface Match {
  /** The two posters on screen, or null once the deck is exhausted. */
  readonly duel: Duel | null
  /** The film currently holding the screen — the winner of the last duel. */
  readonly champion: Film | null
  readonly history: readonly Choice[]
  /** Duels in the whole match: one per film after the first. */
  readonly total: number
  readonly isOver: boolean
  choose(side: Side): Choice | null
}

export interface Run {
  winner: Film
  beaten: Film[]
}

/**
 * The match history grouped into runs: a champion that survives five duels is one entry
 * with five beaten films, not five identical rows.
 */
export function championRuns(history: readonly Choice[]): Run[] {
  const runs: Run[] = []
  for (const choice of history) {
    const current = runs[runs.length - 1]
    if (current && current.winner.id === choice.winner.id) {
      current.beaten.push(choice.loser)
    } else {
      runs.push({ winner: choice.winner, beaten: [choice.loser] })
    }
  }
  return runs
}

/**
 * King of the hill: the first film takes on the second, whoever wins stays and meets the
 * next film in the deck. Every film shows up exactly once as a challenger, so a deck of N
 * films is N-1 duels and ends with a single champion.
 */
export function createMatch(deck: readonly Film[], rng: Rng): Match {
  const queue = [...deck]
  let champion = queue.shift() ?? null
  let challenger = queue.shift() ?? null
  let championOnLeft = rng() < 0.5
  const history: Choice[] = []
  const total = Math.max(deck.length - 1, 0)

  const match: Match = {
    get duel() {
      if (!champion || !challenger) {
        return null
      }
      return championOnLeft
        ? { left: champion, right: challenger }
        : { left: challenger, right: champion }
    },
    get champion() {
      return champion
    },
    get history() {
      return history
    },
    total,
    get isOver() {
      return challenger === null
    },
    choose(side: Side): Choice | null {
      const duel = match.duel
      if (!duel) {
        return null
      }
      const winner = side === 'left' ? duel.left : duel.right
      const loser = side === 'left' ? duel.right : duel.left
      const choice = { winner, loser }
      history.push(choice)
      champion = winner
      challenger = queue.shift() ?? null
      // The champion swaps sides between duels so the answer is never "swipe the same way".
      championOnLeft = rng() < 0.5
      return choice
    },
  }

  return match
}
