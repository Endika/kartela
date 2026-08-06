import { CATEGORIES, LANGS, isLang, type Category } from '../domain/film'
import { deckSize } from '../domain/deck'
import { DURATIONS, type Options } from '../domain/options'
import type { TranslationKey, Translator } from '../domain/ports'
import { clear, el } from './dom'
import { STUDIOS } from './studios'
import type { Deps } from './deps'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crown'
const CHIP = `rounded-2xl px-4 py-3 font-display text-left text-sm font-bold ring-2 transition-colors ${FOCUS}`
// A switched-on studio wears its own colour, the same one its cards use in a duel. Solid
// coral is reserved for the one thing you actually press.
const CHIP_OFF = 'bg-stage-soft text-white/65 ring-transparent'
const CHIP_ON_NEUTRAL = 'bg-crown/15 text-crown ring-crown'

export function renderStartScreen(
  root: HTMLElement,
  deps: Deps,
  options: Options,
  onPlay: (options: Options) => void,
): void {
  const films = deps.catalogue.all()
  const draft: Options = { ...options, categories: [...options.categories] }
  let translator: Translator = deps.translations.for(draft.lang)

  function update(change: Partial<Options>): void {
    Object.assign(draft, change)
    deps.options.save(draft)
    translator = deps.translations.for(draft.lang)
    draw()
  }

  function toggleCategory(category: Category): void {
    const next = draft.categories.includes(category)
      ? draft.categories.filter((value) => value !== category)
      : [...draft.categories, category]
    update({ categories: next })
  }

  function draw(): void {
    const t = (key: TranslationKey, params?: Record<string, string | number>): string =>
      translator.t(key, params)
    const size = deckSize(films, draft)
    const playable = size >= 2

    const studios = el(
      'div',
      { class: 'grid grid-cols-2 gap-2', role: 'group', 'aria-label': t('studios') },
      CATEGORIES.map((category) => {
        const on = draft.categories.includes(category)
        const studio = STUDIOS[category]
        const chip = el('button', {
          type: 'button',
          class: `${CHIP} ${on ? studio.chipOn : CHIP_OFF}`,
          'aria-pressed': String(on),
        })
        chip.textContent = t(studio.label)
        chip.addEventListener('click', () => toggleCategory(category))
        return chip
      }),
    )

    const sequels = el('button', {
      type: 'button',
      class: `${CHIP} w-full ${draft.includeSequels ? CHIP_ON_NEUTRAL : CHIP_OFF}`,
      'aria-pressed': String(draft.includeSequels),
    })
    sequels.textContent = t('includeSequels')
    sequels.addEventListener('click', () => update({ includeSequels: !draft.includeSequels }))

    const lengths = el(
      'div',
      { class: 'grid grid-cols-3 gap-2', role: 'group', 'aria-label': t('howLong') },
      DURATIONS.map((duration) => {
        const on = draft.duration === duration
        const button = el('button', {
          type: 'button',
          class: `${CHIP} text-center ${on ? CHIP_ON_NEUTRAL : CHIP_OFF}`,
          'aria-pressed': String(on),
        })
        button.textContent = t(duration)
        button.addEventListener('click', () => update({ duration }))
        return button
      }),
    )

    const count = el('p', {
      class: 'text-center text-sm text-white/75',
      id: 'deck-size',
      'aria-live': 'polite',
    })
    count.textContent = playable
      ? t('films', { n: size })
      : draft.categories.length === 0
        ? t('pickAStudio')
        : t('notEnoughFilms')

    const play = el('button', {
      type: 'button',
      class: `rounded-full bg-brand px-10 py-4 font-display text-xl font-extrabold text-stage shadow-lg shadow-brand/25 disabled:bg-stage-soft disabled:text-white/50 disabled:shadow-none ${FOCUS}`,
      disabled: !playable,
      'aria-describedby': 'deck-size',
    })
    play.textContent = t('play')
    play.addEventListener('click', () => onPlay({ ...draft, categories: [...draft.categories] }))

    const language = el(
      'select',
      {
        class: `min-w-0 rounded-full bg-stage-soft px-4 py-2 text-sm text-white/80 ${FOCUS}`,
        'aria-label': t('language'),
      },
      LANGS.map((lang) => {
        const option = el('option', { value: lang, selected: lang === draft.lang })
        option.textContent = deps.translations.name(lang)
        return option
      }),
    )
    language.addEventListener('change', () => {
      const value = language.value
      update({ lang: isLang(value) ? value : draft.lang })
    })

    const title = el('h1', {
      class: 'font-display text-5xl font-extrabold tracking-tight text-crown',
    })
    title.textContent = 'Kartela'
    const tagline = el('p', { class: 'font-display text-lg font-bold text-white/80' })
    tagline.textContent = t('tagline')

    clear(root)
    root.append(
      el('main', { class: 'mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8' }, [
        el('header', { class: 'flex flex-col items-center gap-1 text-center' }, [title, tagline]),
        el('section', { class: 'flex flex-col gap-2' }, [studios, sequels]),
        el('section', { class: 'flex flex-col gap-2' }, [lengths]),
        count,
        el('div', { class: 'flex flex-col items-center gap-6' }, [play, language]),
      ]),
    )
  }

  draw()
}
