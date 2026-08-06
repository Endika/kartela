import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CATALOG, CATEGORIES, LANGS } from '../src/data/catalog'

const POSTERS = join(import.meta.dirname, '..', 'public', 'posters')
const POSTER_BUDGET_BYTES = 5 * 1024 * 1024

describe('catalog', () => {
  it('ships at least 140 films', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(140)
  })

  it('has films in every category', () => {
    for (const category of CATEGORIES) {
      const films = CATALOG.filter((film) => film.category === category)
      expect(films.length, category).toBeGreaterThan(0)
    }
  })

  it('uses no category outside the four known ones', () => {
    const unknown = CATALOG.filter((film) => !CATEGORIES.includes(film.category))
    expect(unknown.map((film) => film.id)).toEqual([])
  })

  it('gives every film a unique id', () => {
    const ids = CATALOG.map((film) => film.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks some films as sequels and some as not', () => {
    expect(CATALOG.some((film) => film.sequel)).toBe(true)
    expect(CATALOG.some((film) => !film.sequel)).toBe(true)
  })

  it('gives every film a title in all six languages', () => {
    const missing = CATALOG.flatMap((film) =>
      LANGS.filter((lang) => !film.titles[lang]?.trim()).map((lang) => `${film.id}:${lang}`),
    )
    expect(missing).toEqual([])
  })

  it('gives every film a plausible release year', () => {
    const odd = CATALOG.filter((film) => film.year < 1937 || film.year > 2026)
    expect(odd.map((film) => `${film.id}=${film.year}`)).toEqual([])
  })

  it('ships a poster file for every film', () => {
    const onDisk = new Set(readdirSync(POSTERS))
    const missing = CATALOG.filter((film) => !onDisk.has(film.poster))
    expect(missing.map((film) => film.poster)).toEqual([])
  })

  it('leaves no orphan poster behind', () => {
    const referenced = new Set(CATALOG.map((film) => film.poster))
    const orphans = readdirSync(POSTERS).filter((file) => !referenced.has(file))
    expect(orphans).toEqual([])
  })

  it('keeps the posters inside the size budget', () => {
    const bytes = readdirSync(POSTERS).reduce(
      (total, file) => total + statSync(join(POSTERS, file)).size,
      0,
    )
    expect(bytes).toBeLessThanOrEqual(POSTER_BUDGET_BYTES)
  })
})
