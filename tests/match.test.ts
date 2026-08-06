import { describe, expect, it } from 'vitest'
import { CATALOG, type Film } from '../src/data/catalog'
import { buildDeck, DURATION_SIZES, eligible } from '../src/core/deck'
import { createMatch } from '../src/core/match'
import { createRng } from '../src/core/rng'

const ALL_CATEGORIES = ['disney', 'pixar', 'dreamworks', 'live-action'] as const

function deckOf(size: number): Film[] {
  return CATALOG.slice(0, size)
}

/** Plays a whole match by always keeping whatever sits on the given side. */
function playAll(deck: readonly Film[], seed: number, side: 'left' | 'right' = 'left') {
  const match = createMatch(deck, createRng(seed))
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
      CATALOG,
      { categories: ['pixar'], includeSequels: true, duration: 'full' },
      createRng(1),
    )
    expect(deck.length).toBeGreaterThan(0)
    expect(deck.every((film) => film.category === 'pixar')).toBe(true)
  })

  it('drops sequels when asked to', () => {
    const options = { categories: ALL_CATEGORIES, includeSequels: false, duration: 'full' } as const
    const deck = buildDeck(CATALOG, options, createRng(1))
    expect(deck.some((film) => film.sequel)).toBe(false)
    expect(deck.length).toBeLessThan(CATALOG.length)
  })

  it('cuts the deck to the chosen duration', () => {
    const options = { categories: ALL_CATEGORIES, includeSequels: true, duration: 'short' } as const
    expect(buildDeck(CATALOG, options, createRng(7))).toHaveLength(DURATION_SIZES.short as number)
  })

  it('falls back to whatever is eligible when the duration asks for more', () => {
    const options = { categories: ['pixar'], includeSequels: false, duration: 'medium' } as const
    const available = eligible(CATALOG, options)
    const deck = buildDeck(CATALOG, options, createRng(3))
    expect(deck).toHaveLength(Math.min(available.length, DURATION_SIZES.medium as number))
  })

  it('never repeats a film inside a deck', () => {
    const deck = buildDeck(
      CATALOG,
      { categories: ALL_CATEGORIES, includeSequels: true, duration: 'full' },
      createRng(11),
    )
    expect(new Set(deck.map((film) => film.id)).size).toBe(deck.length)
  })

  it('shuffles differently for different seeds', () => {
    const options = { categories: ALL_CATEGORIES, includeSequels: true, duration: 'short' } as const
    const first = buildDeck(CATALOG, options, createRng(1)).map((film) => film.id)
    const second = buildDeck(CATALOG, options, createRng(2)).map((film) => film.id)
    expect(first).not.toEqual(second)
  })
})

describe('match', () => {
  it('produces one choice fewer than the deck size and a single champion', () => {
    const deck = deckOf(12)
    const { match } = playAll(deck, 42)
    expect(match.history).toHaveLength(deck.length - 1)
    expect(match.total).toBe(deck.length - 1)
    expect(match.champion).not.toBeNull()
    expect(deck).toContain(match.champion)
  })

  it('shows every film exactly once across the whole match', () => {
    const deck = deckOf(20)
    const { seen } = playAll(deck, 7)
    expect(seen).toHaveLength(deck.length)
    expect(new Set(seen.map((film) => film.id)).size).toBe(deck.length)
  })

  it('keeps the winner on screen for the next duel', () => {
    const match = createMatch(deckOf(6), createRng(5))
    const choice = match.choose('left')
    expect(choice?.winner).toBe(match.champion)
    const next = match.duel
    expect([next?.left, next?.right]).toContain(match.champion)
  })

  it('never brings a beaten film back', () => {
    const match = createMatch(deckOf(15), createRng(9))
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
    const match = createMatch(deckOf(4), createRng(2))
    while (!match.isOver) {
      const duel = match.duel
      const choice = match.choose('left')
      expect(choice?.winner).toBe(duel?.left)
      expect(choice?.loser).toBe(duel?.right)
    }
    expect(match.history.map((choice) => choice.loser.id)).toHaveLength(3)
  })

  it('swaps the champion between sides so the answer is never the same swipe', () => {
    const sides = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const match = createMatch(deckOf(10), createRng(seed))
      while (!match.isOver) {
        match.choose('left')
        const duel = match.duel
        if (duel) {
          sides.add(duel.left === match.champion ? 'left' : 'right')
        }
      }
    }
    expect(sides).toEqual(new Set(['left', 'right']))
  })

  it('ends immediately with a one-film deck', () => {
    const match = createMatch(deckOf(1), createRng(1))
    expect(match.isOver).toBe(true)
    expect(match.duel).toBeNull()
    expect(match.champion).toBe(CATALOG[0])
    expect(match.history).toEqual([])
  })

  it('survives an empty deck', () => {
    const match = createMatch([], createRng(1))
    expect(match.isOver).toBe(true)
    expect(match.duel).toBeNull()
    expect(match.champion).toBeNull()
    expect(match.choose('left')).toBeNull()
  })

  it('replays identically for the same seed', () => {
    const first = playAll(deckOf(16), 123).match.history.map((choice) => choice.winner.id)
    const second = playAll(deckOf(16), 123).match.history.map((choice) => choice.winner.id)
    expect(first).toEqual(second)
  })
})
