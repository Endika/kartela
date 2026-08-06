import { titleOf, type Film, type Lang } from '../domain/film'
import type { Match, Side } from '../domain/match'
import type { FilmCatalogue, Translator } from '../domain/ports'
import { clear, el } from './dom'
import type { Deps } from './deps'
import { STUDIOS } from './studios'
import { attachDrag, prefersReducedMotion } from './swipe'

const EXIT_MS = 280
const ENTER_MS = 220
const SNAP_MS = 180
/** Overshoots a little on the way in, so a card lands like a card and not like a div. */
const SPRING = 'cubic-bezier(0.2, 0.9, 0.25, 1.2)'

/** How far a card slides with the finger, and how much it tilts doing it. */
const FOLLOW_PX = 26
const TILT_DEG = 5

const CARD =
  'relative flex min-w-0 flex-1 flex-col items-center gap-2 rounded-3xl bg-stage-soft p-2 ring-4 will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crown'
const TAB =
  'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 font-display text-[10px] font-extrabold tracking-wide whitespace-nowrap'

const CROWN_SVG = `<svg viewBox="0 0 24 19" width="100%" aria-hidden="true">
  <path d="M2.6 16.2 1 4.8l6.4 4.1L12 1.6l4.6 7.3L23 4.8l-1.6 11.4z"
    fill="var(--color-crown)" stroke="var(--color-stage)" stroke-width="1.6"
    stroke-linejoin="round" />
  <circle cx="12" cy="1.6" r="1.7" fill="var(--color-crown)" stroke="var(--color-stage)" stroke-width="1.2" />
</svg>`

interface Card {
  root: HTMLElement
  image: HTMLImageElement
  caption: HTMLElement
  tab: HTMLElement
}

function createCard(side: Side): Card {
  const image = el('img', {
    class: 'max-h-full max-w-full rounded-xl object-contain shadow-lg shadow-black/50',
    alt: '',
    draggable: 'false',
  })
  // Posters come in slightly different shapes, so each one sits in a box of the same
  // aspect ratio — otherwise the two captions never line up.
  const frame = el('span', { class: 'flex aspect-2/3 w-full items-center justify-center' }, [image])
  // w-full keeps a long title wrapping inside the card instead of poking out of the
  // viewport once the card slides and scales under the finger.
  const caption = el('p', {
    class: 'w-full font-display text-center text-sm font-bold text-balance text-white/90',
  })
  const tab = el('span', { class: TAB })
  const root = el('button', { type: 'button', class: CARD, 'data-side': side }, [
    tab,
    frame,
    caption,
  ])
  return { root, image, caption, tab }
}

function show(card: Card, film: Film, catalogue: FilmCatalogue, lang: Lang, t: Translator): void {
  const studio = STUDIOS[film.category]
  card.root.className = `${CARD} ${studio.frame}`
  card.tab.className = `${TAB} ${studio.tabFill}`
  card.tab.textContent = t.t(studio.tab)
  card.image.src = catalogue.posterUrl(film)
  card.image.alt = titleOf(film, lang)
  card.caption.textContent = `${titleOf(film, lang)} · ${film.year}`
}

export function renderMatchScreen(
  root: HTMLElement,
  deps: Deps,
  match: Match,
  lang: Lang,
  onFinish: () => void,
): () => void {
  const translator: Translator = deps.translations.for(lang)
  const left = createCard('left')
  const right = createCard('right')
  const cards = [left, right]

  // The champion always holds the left card, so the crown lives there and only shows up
  // once somebody has actually won a duel.
  const crown = el('span', {
    class: 'crown absolute -top-4 left-0 w-9',
    role: 'img',
    'aria-label': translator.t('leading'),
    hidden: true,
  })
  // A static, authored SVG rather than 👑: an emoji font is not guaranteed on every device,
  // and a missing glyph renders as a tofu box.
  crown.innerHTML = CROWN_SVG
  left.root.append(crown)

  const counter = el('p', {
    class: 'font-display text-base font-extrabold text-crown',
    id: 'round',
    'aria-live': 'polite',
  })
  const hint = el('p', { class: 'text-center text-sm text-white/70' })
  hint.textContent = translator.t('swipeHint')

  const arena = el(
    'div',
    { class: 'flex w-full max-w-md touch-none items-start justify-center gap-3 pt-5 select-none' },
    [left.root, right.root],
  )

  let busy = false

  function paint(): void {
    const duel = match.duel
    if (!duel) {
      return
    }
    counter.textContent = translator.t('round', {
      n: match.history.length + 1,
      total: match.total,
    })
    show(left, duel.left, deps.catalogue, lang, translator)
    show(right, duel.right, deps.catalogue, lang, translator)
    const crowned = match.history.length > 0
    crown.hidden = !crowned
    if (crowned && !prefersReducedMotion()) {
      crown.classList.remove('crown-hop')
      // Reading offsetWidth restarts the animation for the new champion.
      void crown.offsetWidth
      crown.classList.add('crown-hop')
    }
  }

  function settle(card: Card): void {
    card.root.style.transition = ''
    card.root.style.transform = ''
    card.root.style.opacity = ''
  }

  /** Both cards lean the way the finger goes; the one being chosen lifts and grows. */
  function progress(ratio: number): void {
    if (busy) {
      return
    }
    const lean = Math.abs(ratio)
    const slide = ratio * FOLLOW_PX
    const tilt = ratio * TILT_DEG
    const chosen = ratio > 0 ? right : left
    const other = ratio > 0 ? left : right
    chosen.root.style.transition = ''
    other.root.style.transition = ''
    chosen.root.style.transform = `translate3d(${slide}px, ${-10 * lean}px, 0) rotate(${tilt}deg) scale(${1 + 0.08 * lean})`
    chosen.root.style.opacity = '1'
    other.root.style.transform = `translate3d(${slide * 0.45}px, ${5 * lean}px, 0) rotate(${tilt * 0.4}deg) scale(${1 - 0.07 * lean})`
    other.root.style.opacity = String(1 - 0.45 * lean)
  }

  /** A drag that never reached the threshold springs the cards back into place. */
  function snapBack(): void {
    if (busy) {
      return
    }
    for (const card of cards) {
      card.root.style.transition = `transform ${SNAP_MS}ms ${SPRING}, opacity ${SNAP_MS}ms ease-out`
      card.root.style.transform = ''
      card.root.style.opacity = ''
    }
    window.setTimeout(() => {
      for (const card of cards) {
        card.root.style.transition = ''
      }
    }, SNAP_MS)
  }

  /** The new challenger flies in from the right, where challengers always come from. */
  function enterChallenger(): void {
    right.root.style.transition = ''
    right.root.style.transform = 'translate3d(45%, 8%, 0) rotate(7deg) scale(0.86)'
    right.root.style.opacity = '0'
    requestAnimationFrame(() => {
      right.root.style.transition = `transform ${ENTER_MS}ms ${SPRING}, opacity ${ENTER_MS}ms ease-out`
      right.root.style.transform = ''
      right.root.style.opacity = '1'
      window.setTimeout(() => settle(right), ENTER_MS)
    })
  }

  function advance(): void {
    busy = false
    for (const card of cards) {
      settle(card)
    }
    if (match.isOver) {
      onFinish()
      return
    }
    paint()
    if (!prefersReducedMotion()) {
      enterChallenger()
    }
  }

  function commit(side: Side): void {
    if (busy || match.isOver) {
      return
    }
    busy = true
    const winner = side === 'left' ? left : right
    const loser = side === 'left' ? right : left
    // A winning challenger slides across into the champion's slot on the left.
    const shift =
      side === 'right'
        ? left.root.getBoundingClientRect().left - right.root.getBoundingClientRect().left
        : 0

    match.choose(side)

    if (prefersReducedMotion()) {
      advance()
      return
    }

    for (const card of cards) {
      card.root.style.transition = `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out`
    }
    winner.root.style.transform = `translate3d(${shift}px, 0, 0) scale(1.06)`
    winner.root.style.opacity = '1'
    loser.root.style.transform = `translate3d(${side === 'left' ? '75%' : '-75%'}, 14%, 0) rotate(${side === 'left' ? 16 : -16}deg) scale(0.68)`
    loser.root.style.opacity = '0'
    window.setTimeout(advance, EXIT_MS)
  }

  const detachDrag = attachDrag(arena, {
    onProgress: progress,
    onCommit: commit,
    onCancel: snapBack,
  })

  left.root.addEventListener('click', () => commit('left'))
  right.root.addEventListener('click', () => commit('right'))

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      commit('left')
    } else if (event.key === 'ArrowRight') {
      commit('right')
    }
  }
  window.addEventListener('keydown', onKey)

  clear(root)
  root.append(
    el(
      'main',
      {
        class: 'mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-3 pt-4 pb-6',
      },
      [
        counter,
        el('div', { class: 'flex w-full flex-1 items-center justify-center' }, [arena]),
        hint,
      ],
    ),
  )
  paint()

  return () => {
    detachDrag()
    window.removeEventListener('keydown', onKey)
  }
}
