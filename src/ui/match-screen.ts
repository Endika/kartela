import { titleOf, type Film, type Lang } from '../domain/film'
import type { Match, Side } from '../domain/match'
import type { FilmCatalogue, Translator } from '../domain/ports'
import { clear, el } from './dom'
import type { Deps } from './deps'
import { attachDrag, prefersReducedMotion } from './swipe'

const EXIT_MS = 260

interface Card {
  root: HTMLElement
  image: HTMLImageElement
  caption: HTMLElement
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
  const caption = el('p', { class: 'text-center text-sm font-semibold text-white/90' })
  const root = el(
    'button',
    {
      type: 'button',
      class:
        'flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold',
      'data-side': side,
    },
    [frame, caption],
  )
  return { root, image, caption }
}

function show(card: Card, film: Film, catalogue: FilmCatalogue, lang: Lang): void {
  card.image.src = catalogue.posterUrl(film)
  card.image.alt = titleOf(film, lang)
  card.caption.textContent = `${titleOf(film, lang)} · ${film.year}`
  card.root.style.transform = ''
  card.root.style.opacity = ''
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
  const counter = el('p', { class: 'text-sm font-semibold text-gold', 'aria-live': 'polite' })
  const hint = el('p', { class: 'text-center text-sm text-white/70' })
  hint.textContent = translator.t('swipeHint')

  const arena = el(
    'div',
    { class: 'flex w-full max-w-md touch-none items-center justify-center gap-3 select-none' },
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
    show(left, duel.left, deps.catalogue, lang)
    show(right, duel.right, deps.catalogue, lang)
  }

  function progress(ratio: number): void {
    if (busy) {
      return
    }
    const lean = Math.abs(ratio)
    const target = ratio > 0 ? right : left
    const other = ratio > 0 ? left : right
    target.root.style.transform = `scale(${1 + lean * 0.06})`
    target.root.style.opacity = '1'
    other.root.style.transform = `scale(${1 - lean * 0.06})`
    other.root.style.opacity = String(1 - lean * 0.45)
  }

  function reset(): void {
    for (const card of [left, right]) {
      card.root.style.transform = ''
      card.root.style.opacity = ''
    }
  }

  function commit(side: Side): void {
    if (busy || match.isOver) {
      return
    }
    busy = true
    const winner = side === 'left' ? left : right
    const loser = side === 'left' ? right : left
    const instant = prefersReducedMotion()

    const advance = (): void => {
      busy = false
      reset()
      if (match.isOver) {
        onFinish()
      } else {
        paint()
      }
    }

    match.choose(side)

    if (instant) {
      advance()
      return
    }
    for (const card of [winner, loser]) {
      card.root.style.transition = `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out`
    }
    winner.root.style.transform = 'scale(1.12)'
    loser.root.style.transform = `translateX(${side === 'left' ? '60%' : '-60%'}) scale(0.7)`
    loser.root.style.opacity = '0'
    window.setTimeout(() => {
      for (const card of [winner, loser]) {
        card.root.style.transition = ''
      }
      advance()
    }, EXIT_MS)
  }

  const detachDrag = attachDrag(arena, {
    onProgress: progress,
    onCommit: commit,
    onCancel: reset,
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
        class:
          'mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-3 py-6',
      },
      [counter, arena, hint],
    ),
  )
  paint()

  return () => {
    detachDrag()
    window.removeEventListener('keydown', onKey)
  }
}
