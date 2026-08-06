import { CATEGORIES, LANGS, type Category } from '../data/catalog'
import { CATALOG } from '../data/catalog'
import { DURATIONS, DURATION_SIZES, eligible, type Duration } from '../core/deck'
import { LANG_NAMES, setLang, t, type Dict } from '../i18n'
import { clear, el } from './dom'
import { saveOptions, type Options } from './options'

const CATEGORY_LABELS: Record<Category, keyof Dict> = {
  disney: 'disney',
  pixar: 'pixar',
  dreamworks: 'dreamworks',
  'live-action': 'liveAction',
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold'
const CHIP = `rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-2 transition-colors ${FOCUS}`
// Only the play button is solid gold: chips that are on get a gold outline instead, so six
// switched-on studios do not compete with the one thing you actually press.
const CHIP_ON = 'bg-gold/15 text-gold ring-gold'
const CHIP_OFF = 'bg-night-soft text-white/65 ring-transparent'

export function deckSize(options: Options): number {
  const available = eligible(CATALOG, options).length
  const limit = DURATION_SIZES[options.duration]
  return limit === null ? available : Math.min(available, limit)
}

export function renderStartScreen(
  root: HTMLElement,
  options: Options,
  onPlay: (options: Options) => void,
): void {
  const draft: Options = { ...options, categories: [...options.categories] }

  function update(change: Partial<Options>): void {
    Object.assign(draft, change)
    saveOptions(draft)
    setLang(draft.lang)
    draw()
  }

  function toggleCategory(category: Category): void {
    const next = draft.categories.includes(category)
      ? draft.categories.filter((value) => value !== category)
      : [...draft.categories, category]
    update({ categories: next })
  }

  function draw(): void {
    const size = deckSize(draft)
    const playable = size >= 2

    const studios = el(
      'div',
      { class: 'grid grid-cols-2 gap-2', role: 'group', 'aria-label': t('studios') },
      CATEGORIES.map((category) => {
        const on = draft.categories.includes(category)
        const chip = el('button', {
          type: 'button',
          class: `${CHIP} ${on ? CHIP_ON : CHIP_OFF}`,
          'aria-pressed': String(on),
        })
        chip.textContent = t(CATEGORY_LABELS[category])
        chip.addEventListener('click', () => toggleCategory(category))
        return chip
      }),
    )

    const sequels = el('button', {
      type: 'button',
      class: `${CHIP} w-full ${draft.includeSequels ? CHIP_ON : CHIP_OFF}`,
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
          class: `${CHIP} text-center ${on ? CHIP_ON : CHIP_OFF}`,
          'aria-pressed': String(on),
        })
        button.textContent = t(duration as keyof Dict)
        button.addEventListener('click', () => update({ duration: duration as Duration }))
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
      class: `rounded-full bg-gold px-8 py-4 text-lg font-bold text-night disabled:bg-night-soft disabled:text-white/50 ${FOCUS}`,
      disabled: !playable,
      'aria-describedby': 'deck-size',
    })
    play.textContent = t('play')
    play.addEventListener('click', () => onPlay({ ...draft, categories: [...draft.categories] }))

    const language = el(
      'select',
      {
        class: `min-w-0 rounded-full bg-night-soft px-4 py-2 text-sm text-white/80 ${FOCUS}`,
        'aria-label': t('language'),
      },
      LANGS.map((lang) => {
        const option = el('option', { value: lang, selected: lang === draft.lang })
        option.textContent = LANG_NAMES[lang]
        return option
      }),
    )
    language.addEventListener('change', () => {
      const value = language.value
      update({ lang: LANGS.find((lang) => lang === value) ?? draft.lang })
    })

    const title = el('h1', { class: 'text-4xl font-black tracking-tight text-gold' })
    title.textContent = 'Kartela'
    const tagline = el('p', { class: 'text-lg text-white/80' })
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
