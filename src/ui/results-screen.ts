import { titleOf, type Film, type Lang } from '../domain/film'
import { championRuns, type Match } from '../domain/match'
import { clear, el } from './dom'
import type { Deps } from './deps'

export function renderResultsScreen(
  root: HTMLElement,
  deps: Deps,
  match: Match,
  lang: Lang,
  onAgain: () => void,
  onChange: () => void,
): void {
  const { t } = deps.translations.for(lang)
  const posterUrl = (film: Film): string => deps.catalogue.posterUrl(film)
  const champion = match.champion

  const header = el('section', { class: 'flex flex-col items-center gap-2' })
  if (champion) {
    const label = el('p', { class: 'text-sm font-semibold tracking-wide text-gold uppercase' })
    label.textContent = t('favourite')
    const poster = el('img', {
      class: 'w-40 rounded-2xl shadow-xl shadow-black/50',
      src: posterUrl(champion),
      alt: titleOf(champion, lang),
    })
    const name = el('h2', { class: 'text-center text-xl font-bold' })
    name.textContent = `${titleOf(champion, lang)} · ${champion.year}`
    header.append(label, poster, name)
  }

  const listTitle = el('h3', { class: 'text-sm font-semibold text-white/75' })
  listTitle.textContent = t('yourPicks')

  // Latest pick first: the champion's run sits at the top of the list.
  const runs = championRuns(match.history).reverse()
  const list = el(
    'ol',
    { class: 'flex flex-col gap-2' },
    runs.map((run) => {
      const thumb = el('img', {
        class: 'h-16 w-11 shrink-0 rounded-md object-cover',
        src: posterUrl(run.winner),
        alt: '',
      })
      const name = el('p', { class: 'text-sm font-semibold' })
      name.textContent = `${titleOf(run.winner, lang)} · ${run.winner.year}`
      const over = el('p', { class: 'text-xs text-white/60' })
      over.textContent = `${t('beats')} ${run.beaten.map((film) => titleOf(film, lang)).join(' · ')}`
      return el('li', { class: 'flex items-center gap-3 rounded-xl bg-night-soft/70 p-2' }, [
        thumb,
        el('div', { class: 'flex min-w-0 flex-col' }, [name, over]),
      ])
    }),
  )

  // Every duel, oldest first, so you can look a film up and see what knocked it out.
  const duels = el(
    'ol',
    { class: 'flex flex-col gap-1 pt-2' },
    match.history.map((choice, index) => {
      const rank = el('span', { class: 'w-6 shrink-0 text-right text-white/35' })
      rank.textContent = String(index + 1)
      const won = el('span', { class: 'font-semibold text-white/85' })
      won.textContent = titleOf(choice.winner, lang)
      const lost = el('span', { class: 'text-white/45 line-through' })
      lost.textContent = titleOf(choice.loser, lang)
      return el('li', { class: 'flex items-baseline gap-2 text-xs' }, [
        rank,
        el('span', { class: 'min-w-0' }, [won, document.createTextNode(' · '), lost]),
      ])
    }),
  )

  const summary = el('summary', {
    class:
      'cursor-pointer text-sm font-semibold text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
  })
  summary.textContent = `${t('fullHistory')} (${match.history.length})`
  const history = el('details', { class: 'rounded-xl bg-night-soft/40 px-3 py-2' }, [
    summary,
    duels,
  ])

  const again = el('button', {
    type: 'button',
    class:
      'rounded-full bg-gold px-8 py-4 text-lg font-bold text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
  })
  again.textContent = t('playAgain')
  again.addEventListener('click', onAgain)

  const change = el('button', {
    type: 'button',
    class:
      'rounded-full bg-night-soft px-6 py-3 text-sm font-semibold text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
  })
  change.textContent = t('change')
  change.addEventListener('click', onChange)

  clear(root)
  root.append(
    el('main', { class: 'mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8' }, [
      header,
      el('section', { class: 'flex flex-col gap-2' }, [listTitle, list, history]),
      el('div', { class: 'flex flex-col items-center gap-3' }, [again, change]),
    ]),
  )
}
