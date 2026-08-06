import { CATALOG } from './data/catalog'
import { buildDeck } from './core/deck'
import { createMatch, type Match } from './core/match'
import { createRng, randomSeed } from './core/rng'
import { setLang } from './i18n'
import { loadOptions } from './app/options'
import { renderStartScreen } from './app/start-screen'
import { renderMatchScreen } from './app/match-screen'
import { renderResultsScreen } from './app/results-screen'

const host = document.querySelector<HTMLDivElement>('#app')

if (host) {
  let options = loadOptions()
  let teardown: (() => void) | null = null

  function swap(render: (root: HTMLDivElement) => (() => void) | void): void {
    teardown?.()
    teardown = render(host as HTMLDivElement) ?? null
  }

  function start(): void {
    setLang(options.lang)
    swap((root) => {
      renderStartScreen(root, options, (chosen) => {
        options = chosen
        play()
      })
    })
  }

  function play(): void {
    const deck = buildDeck(CATALOG, options, createRng(randomSeed()))
    const match = createMatch(deck, createRng(randomSeed()))
    swap((root) => renderMatchScreen(root, match, options.lang, () => results(match)))
  }

  function results(match: Match): void {
    swap((root) => {
      renderResultsScreen(root, match, options.lang, play, start)
    })
  }

  start()
}
