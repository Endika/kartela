import { buildDeck } from './domain/deck'
import { createMatch, type Match } from './domain/match'
import type { Options } from './domain/options'
import { bundledCatalogue } from './adapters/bundled-catalogue'
import { localeTranslations } from './adapters/locale-translations'
import { storedOptions } from './adapters/local-storage-options'
import { systemRandom } from './adapters/seeded-random'
import type { Deps } from './ui/deps'
import { renderStartScreen } from './ui/start-screen'
import { renderMatchScreen } from './ui/match-screen'
import { renderResultsScreen } from './ui/results-screen'

/** Composition root: the one place that picks a real implementation for every port. */
function composeDeps(): Deps {
  const translations = localeTranslations()
  return {
    catalogue: bundledCatalogue(),
    options: storedOptions(translations),
    translations,
    random: systemRandom,
  }
}

export function startApp(host: HTMLElement, deps: Deps): void {
  let options: Options = deps.options.load()
  let teardown: (() => void) | null = null

  function swap(render: (root: HTMLElement) => (() => void) | void): void {
    teardown?.()
    teardown = render(host) ?? null
  }

  function start(): void {
    swap((root) => {
      renderStartScreen(root, deps, options, (chosen) => {
        options = chosen
        play()
      })
    })
  }

  function play(): void {
    const deck = buildDeck(deps.catalogue.all(), options, deps.random)
    const match = createMatch(deck, deps.random)
    swap((root) => renderMatchScreen(root, deps, match, options.lang, () => results(match)))
  }

  function results(match: Match): void {
    swap((root) => {
      renderResultsScreen(root, deps, match, options.lang, play, start)
    })
  }

  start()
}

const host = document.querySelector<HTMLDivElement>('#app')
if (host) {
  startApp(host, composeDeps())
}
