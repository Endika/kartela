/**
 * Builds src/data/catalog.json and public/posters/*.webp from tools/catalog-seed.json.
 *
 * The seed is the curated source of truth (which films, which category, which are
 * sequels); everything else — localized titles and the poster image — comes from
 * Wikipedia. Responses are cached under tools/.cache so a rerun costs no requests and
 * produces a byte-identical result.
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = join(import.meta.dirname, '..')
const SEED = join(ROOT, 'tools', 'catalog-seed.json')
const CACHE = join(ROOT, 'tools', '.cache')
const POSTERS = join(ROOT, 'public', 'posters')
const OUTPUT = join(ROOT, 'src', 'data', 'catalog.json')

const USER_AGENT = 'kartela/0.1 (https://github.com/Endika/kartela)'
const POSTER_WIDTH = 260
const POSTER_QUALITY = 80
const POSTER_BUDGET_BYTES = 5 * 1024 * 1024
const CONCURRENCY = 2
const REQUEST_SPACING_MS = 200
const MAX_RETRIES = 5
const TITLE_LANGS = ['es', 'eu', 'gl', 'ca'] as const
const OUTPUT_LANGS = ['en', 'es', 'eu', 'gl', 'ca', 'va'] as const

interface SeedEntry {
  page: string
  category: string
  year: number
  sequel: boolean
  titles?: Record<string, string>
}

interface Film {
  id: string
  category: string
  year: number
  sequel: boolean
  poster: string
  titles: Record<string, string>
}

interface Summary {
  title?: string
  originalimage?: { source?: string }
  thumbnail?: { source?: string }
}

interface MetaResponse {
  query?: {
    pages?: {
      langlinks?: { lang: string; title: string }[]
      pageprops?: { wikibase_item?: string }
    }[]
  }
}

interface WikidataResponse {
  entities?: Record<string, { labels?: Record<string, { value?: string }> }>
}

class SkipFilm extends Error {}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "Cinderella (2015 American film)" → "Cinderella" */
function stripDisambiguator(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

async function cached(name: string, fetchFresh: () => Promise<Buffer>): Promise<Buffer> {
  const path = join(CACHE, name)
  try {
    return await readFile(path)
  } catch {
    const fresh = await fetchFresh()
    await writeFile(path, fresh)
    return fresh
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// Wikimedia answers 429 well before any documented limit when it decides a client looks
// like a bot, so requests are spaced out globally and every 429 is waited out.
let nextSlot = 0
async function takeSlot(): Promise<void> {
  const now = Date.now()
  const slot = Math.max(now, nextSlot)
  nextSlot = slot + REQUEST_SPACING_MS
  if (slot > now) {
    await sleep(slot - now)
  }
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; ; attempt++) {
    await takeSlot()
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) {
      return Buffer.from(await response.arrayBuffer())
    }
    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new SkipFilm(`${response.status} ${response.statusText} for ${url}`)
    }
    const header = Number(response.headers.get('retry-after'))
    const backoff = Number.isFinite(header) && header > 0 ? header * 1000 : 2 ** attempt * 1000
    console.warn(`  … ${response.status} on ${url} — waiting ${backoff}ms`)
    await sleep(backoff)
  }
}

async function json<T>(name: string, url: string): Promise<T> {
  const body = await cached(name, () => download(url))
  return JSON.parse(body.toString('utf8')) as T
}

/**
 * Localized titles come from two places, best first:
 *
 * 1. the Wikidata label — the title the film was actually released under, and
 * 2. the name of the article on that language's Wikipedia.
 *
 * Wikidata wins because es.wikipedia titles a fair few articles with the original English
 * name ("Snow White and the Seven Dwarfs"), which is not what a child here calls the film.
 */
async function localizedTitles(page: string): Promise<Record<string, string>> {
  const params = new URLSearchParams({
    action: 'query',
    titles: page,
    prop: 'langlinks|pageprops',
    ppprop: 'wikibase_item',
    lllimit: '500',
    redirects: '1',
    format: 'json',
    formatversion: '2',
  })
  const body = await json<MetaResponse>(
    `meta-${slugify(page)}.json`,
    `https://en.wikipedia.org/w/api.php?${params}`,
  )
  const wikiPage = body.query?.pages?.[0]
  const links = new Map(
    (wikiPage?.langlinks ?? []).map((link) => [link.lang, stripDisambiguator(link.title)]),
  )
  const labels = await wikidataLabels(wikiPage?.pageprops?.wikibase_item)
  const titles: Record<string, string> = {}
  for (const lang of TITLE_LANGS) {
    const value = labels.get(lang) ?? links.get(lang)
    if (value) {
      titles[lang] = value
    }
  }
  return titles
}

async function wikidataLabels(qid: string | undefined): Promise<Map<string, string>> {
  if (!qid) {
    return new Map()
  }
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: qid,
    props: 'labels',
    languages: TITLE_LANGS.join('|'),
    format: 'json',
    formatversion: '2',
  })
  const body = await json<WikidataResponse>(
    `wikidata-${qid}.json`,
    `https://www.wikidata.org/w/api.php?${params}`,
  )
  const labels = body.entities?.[qid]?.labels ?? {}
  return new Map(
    Object.entries(labels)
      .map(([lang, label]) => [lang, stripDisambiguator(label.value ?? '')] as const)
      .filter(([, value]) => value.length > 0),
  )
}

async function poster(page: string, id: string): Promise<void> {
  const summary = await json<Summary>(
    `summary-${slugify(page)}.json`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`,
  )
  const source = summary.originalimage?.source ?? summary.thumbnail?.source
  if (!source) {
    throw new SkipFilm('no lead image on the Wikipedia page')
  }
  const original = await cached(`image-${slugify(page)}`, () => download(source))
  const webp = await sharp(original)
    .resize({ width: POSTER_WIDTH, withoutEnlargement: true })
    .webp({ quality: POSTER_QUALITY })
    .toBuffer()
  await writeFile(join(POSTERS, `${id}.webp`), webp)
}

async function english(page: string): Promise<string> {
  const summary = await json<Summary>(
    `summary-${slugify(page)}.json`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`,
  )
  if (!summary.title) {
    throw new SkipFilm('Wikipedia returned no title')
  }
  return stripDisambiguator(summary.title)
}

async function build(entry: SeedEntry): Promise<Film> {
  const en = await english(entry.page)
  const id = `${slugify(en)}-${entry.year}`
  const fetched = await localizedTitles(entry.page)
  const found: Record<string, string> = { en, ...fetched, ...entry.titles }
  if (!found.es) {
    throw new SkipFilm('no Spanish title on Wikipedia — add one to the seed')
  }
  // Wikipedia has no Valencian edition, and the smaller editions are missing plenty of
  // films, so an absent title falls back to Spanish and then English.
  const titles: Record<string, string> = {}
  for (const lang of OUTPUT_LANGS) {
    titles[lang] = found[lang] ?? (lang === 'va' ? found.ca : undefined) ?? found.es ?? en
  }
  await poster(entry.page, id)
  return {
    id,
    category: entry.category,
    year: entry.year,
    sequel: entry.sequel,
    poster: `${id}.webp`,
    titles,
  }
}

async function pool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index] as T)
    }
  })
  await Promise.all(workers)
  return results
}

async function posterBytes(): Promise<number> {
  const files = await readdir(POSTERS)
  const sizes = await Promise.all(files.map((file) => stat(join(POSTERS, file))))
  return sizes.reduce((total, entry) => total + entry.size, 0)
}

const seed = JSON.parse(await readFile(SEED, 'utf8')) as SeedEntry[]
await mkdir(CACHE, { recursive: true })
await rm(POSTERS, { recursive: true, force: true })
await mkdir(POSTERS, { recursive: true })

const failures: string[] = []
const films = (
  await pool(seed, CONCURRENCY, async (entry) => {
    try {
      const film = await build(entry)
      console.log(`✓ ${film.id}`)
      return film
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push(`${entry.page} — ${reason}`)
      return null
    }
  })
).filter((film): film is Film => film !== null)

if (failures.length > 0) {
  console.error(`\n${failures.length} film(s) could not be built:`)
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`)
  }
  console.error('\nFix the seed (drop the film or add a manual title) and run again.')
  process.exit(1)
}

const duplicates = films
  .map((film) => film.id)
  .filter((id, index, all) => all.indexOf(id) !== index)
if (duplicates.length > 0) {
  console.error(`Duplicate ids: ${[...new Set(duplicates)].join(', ')}`)
  process.exit(1)
}

films.sort((a, b) => a.id.localeCompare(b.id, 'en'))
await writeFile(OUTPUT, `${JSON.stringify(films, null, 2)}\n`)

const bytes = await posterBytes()
console.log(`\n${films.length} films, posters ${(bytes / 1024 / 1024).toFixed(2)} MB`)
if (bytes > POSTER_BUDGET_BYTES) {
  console.error(`Posters exceed the ${POSTER_BUDGET_BYTES / 1024 / 1024} MB budget.`)
  process.exit(1)
}
