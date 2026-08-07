import { describe, expect, it } from 'vitest'
import type { Film } from '../src/domain/film'
import { FILMS } from './support/fakes'
import { buildDeck, deckSize, eligible } from '../src/domain/deck'
import { DURATION_SIZES } from '../src/domain/options'
import { championRuns, createMatch, favourites } from '../src/domain/match'
import { seededRandom } from '../src/adapters/seeded-random'

const ALL_CATEGORIES = ['disney', 'pixar', 'dreamworks'] as const

function deckOf(size: number): Film[] {
  return FILMS.slice(0, size)
}

/** Plays a whole match by always keeping whatever sits on the given side. */
function playAll(deck: readonly Film[], side: 'left' | 'right' = 'left') {
  const match = createMatch(deck)
  const seen: Film[] = []
  const duel = match.duel
  if (duel) {
    seen.push(duel.left, duel.right)
  }
  while (!match.isOver) {
    match.choose(side)
    const next = match.duel
    if (next) {
      seen.push(next.left === match.champion ? next.right : next.left)
    }
  }
  return { match, seen }
}

describe('deck', () => {
  it('keeps only the chosen categories', () => {
    const deck = buildDeck(
      FILMS,
      {
        categories: ['pixar'],
        includeSequels: true,
        includeLiveAction: true,
        duration: 'full',
        lang: 'es',
      },
      seededRandom(1),
    )
    expect(deck.length).toBeGreaterThan(0)
    expect(deck.every((film) => film.category === 'pixar')).toBe(true)
  })

  it('drops sequels when asked to', () => {
    const options = {
      categories: ALL_CATEGORIES,
      includeSequels: false,
      includeLiveAction: true,
      duration: 'full',
      lang: 'es',
    } as const
    const deck = buildDeck(FILMS, options, seededRandom(1))
    expect(deck.some((film) => film.sequel)).toBe(false)
    expect(deck.length).toBeLessThan(FILMS.length)
  })

  it('cuts the deck to the chosen duration', () => {
    const options = {
      categories: ALL_CATEGORIES,
      includeSequels: true,
      includeLiveAction: true,
      duration: 'short',
      lang: 'es',
    } as const
    expect(buildDeck(FILMS, options, seededRandom(7))).toHaveLength(DURATION_SIZES.short as number)
  })

  it('falls back to whatever is eligible when the duration asks for more', () => {
    const options = {
      categories: ['pixar'],
      includeSequels: false,
      includeLiveAction: true,
      duration: 'medium',
      lang: 'es',
    } as const
    const available = eligible(FILMS, options)
    const deck = buildDeck(FILMS, options, seededRandom(3))
    expect(deck).toHaveLength(Math.min(available.length, DURATION_SIZES.medium as number))
    expect(deckSize(FILMS, options)).toBe(deck.length)
  })

  it('treats live-action as a filter, not a studio', () => {
    const base = {
      categories: ALL_CATEGORIES,
      includeSequels: true,
      includeLiveAction: true,
      duration: 'full',
      lang: 'es',
    } as const
    const withLive = eligible(FILMS, { ...base, includeLiveAction: true })
    const withoutLive = eligible(FILMS, { ...base, includeLiveAction: false })
    expect(withoutLive.length).toBeLessThan(withLive.length)
    expect(withoutLive.some((film) => film.liveAction)).toBe(false)
    // The live-action films are still Disney films, so switching them off keeps Disney.
    expect(withoutLive.some((film) => film.category === 'disney')).toBe(true)
  })

  it('files a live-action film under the studio that made it', () => {
    const live = FILMS.filter((film) => film.liveAction)
    expect(live.length).toBeGreaterThan(0)
    expect(live.every((film) => ALL_CATEGORIES.includes(film.category))).toBe(true)
    // Live-action is not a Disney-only trait: the Dragon remake is DreamWorks.
    expect(new Set(live.map((film) => film.category)).size).toBeGreaterThan(1)
  })

  it('never repeats a film inside a deck', () => {
    const deck = buildDeck(
      FILMS,
      {
        categories: ALL_CATEGORIES,
        includeSequels: true,
        includeLiveAction: true,
        duration: 'full',
        lang: 'es',
      },
      seededRandom(11),
    )
    expect(new Set(deck.map((film) => film.id)).size).toBe(deck.length)
  })

  it('shuffles differently for different seeds', () => {
    const options = {
      categories: ALL_CATEGORIES,
      includeSequels: true,
      includeLiveAction: true,
      duration: 'short',
      lang: 'es',
    } as const
    const first = buildDeck(FILMS, options, seededRandom(1)).map((film) => film.id)
    const second = buildDeck(FILMS, options, seededRandom(2)).map((film) => film.id)
    expect(first).not.toEqual(second)
  })
})

describe('match', () => {
  it('produces one choice fewer than the deck size and a single champion', () => {
    const deck = deckOf(12)
    const { match } = playAll(deck)
    expect(match.history).toHaveLength(deck.length - 1)
    expect(match.total).toBe(deck.length - 1)
    expect(match.champion).not.toBeNull()
    expect(deck).toContain(match.champion)
  })

  it('shows every film exactly once across the whole match', () => {
    const deck = deckOf(20)
    const { seen } = playAll(deck)
    expect(seen).toHaveLength(deck.length)
    expect(new Set(seen.map((film) => film.id)).size).toBe(deck.length)
  })

  it('keeps the winner on screen for the next duel', () => {
    const match = createMatch(deckOf(6))
    const choice = match.choose('left')
    expect(choice?.winner).toBe(match.champion)
    const next = match.duel
    expect([next?.left, next?.right]).toContain(match.champion)
  })

  it('never brings a beaten film back', () => {
    const match = createMatch(deckOf(15))
    const beaten = new Set<string>()
    while (!match.isOver) {
      const duel = match.duel
      expect(beaten.has(duel?.left.id ?? '')).toBe(false)
      expect(beaten.has(duel?.right.id ?? '')).toBe(false)
      const choice = match.choose('right')
      beaten.add(choice?.loser.id ?? '')
    }
  })

  it('records the winner and loser of each duel', () => {
    const match = createMatch(deckOf(4))
    while (!match.isOver) {
      const duel = match.duel
      const choice = match.choose('left')
      expect(choice?.winner).toBe(duel?.left)
      expect(choice?.loser).toBe(duel?.right)
    }
    expect(match.history.map((choice) => choice.loser.id)).toHaveLength(3)
  })

  it('always keeps the champion on the left and the challenger on the right', () => {
    const deck = deckOf(14)
    const match = createMatch(deck)
    let seenChallengers = 0
    while (!match.isOver) {
      expect(match.duel?.left).toBe(match.champion)
      const challenger = match.duel?.right
      expect(challenger).not.toBe(match.champion)
      seenChallengers += 1
      // Whoever wins, the next duel still shows the champion on the left.
      match.choose(seenChallengers % 2 === 0 ? 'right' : 'left')
    }
    expect(seenChallengers).toBe(deck.length - 1)
  })

  it('ends immediately with a one-film deck', () => {
    const match = createMatch(deckOf(1))
    expect(match.isOver).toBe(true)
    expect(match.duel).toBeNull()
    expect(match.champion).toBe(FILMS[0])
    expect(match.history).toEqual([])
  })

  it('survives an empty deck', () => {
    const match = createMatch([])
    expect(match.isOver).toBe(true)
    expect(match.duel).toBeNull()
    expect(match.champion).toBeNull()
    expect(match.choose('left')).toBeNull()
  })

  it('replays identically for the same seed', () => {
    const first = playAll(deckOf(16)).match.history.map((choice) => choice.winner.id)
    const second = playAll(deckOf(16)).match.history.map((choice) => choice.winner.id)
    expect(first).toEqual(second)
  })
})

describe('championRuns', () => {
  it('groups the duels a single champion won in a row', () => {
    const match = createMatch(deckOf(6))
    while (!match.isOver) {
      // Always keeping the champion means one run for the whole match.
      match.choose(match.duel?.left === match.champion ? 'left' : 'right')
    }
    const runs = championRuns(match.history)
    expect(runs).toHaveLength(1)
    expect(runs[0]?.winner).toBe(match.champion)
    expect(runs[0]?.beaten).toHaveLength(5)
  })

  it('opens a new run every time the challenger wins', () => {
    const match = createMatch(deckOf(5))
    while (!match.isOver) {
      // Always keeping the challenger means a new run every duel.
      match.choose(match.duel?.left === match.champion ? 'right' : 'left')
    }
    const runs = championRuns(match.history)
    expect(runs).toHaveLength(4)
    expect(runs.every((run) => run.beaten.length === 1)).toBe(true)
  })

  it('loses no beaten film while grouping', () => {
    const { match } = playAll(deckOf(20))
    const beaten = championRuns(match.history).flatMap((run) => run.beaten)
    expect(beaten.map((film) => film.id)).toEqual(match.history.map((c) => c.loser.id))
  })

  it('gives no runs for a match with no duels', () => {
    expect(championRuns([])).toEqual([])
  })
})

describe('favourites', () => {
  it('is empty when no duel was ever played', () => {
    expect(favourites(createMatch(deckOf(1)).history)).toEqual([])
  })

  it('yields one film when the first poster wins everything', () => {
    const { match } = playAll(deckOf(5))
    expect(favourites(match.history).map((film) => film.id)).toEqual([FILMS[0]?.id])
  })

  it('lists every film that held the screen, in order of first win', () => {
    const match = createMatch(deckOf(4))
    match.choose('right') // the challenger takes the screen
    match.choose('left') // and holds it
    match.choose('right') // then loses it to the last challenger
    expect(favourites(match.history).map((film) => film.id)).toEqual([FILMS[1]?.id, FILMS[3]?.id])
  })

  it('agrees with championRuns, which cannot record a non-consecutive win', () => {
    const match = createMatch(deckOf(9))
    let round = 0
    while (!match.isOver) {
      round += 1
      match.choose(round % 3 === 0 ? 'right' : 'left')
    }
    expect(favourites(match.history)).toEqual(championRuns(match.history).map((run) => run.winner))
  })
})
