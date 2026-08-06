import { posterUrl, title, type Lang } from '../data/catalog'
import type { Match } from '../core/match'
import { t } from '../i18n'
import { clear, el } from './dom'

export function renderResultsScreen(
  root: HTMLElement,
  match: Match,
  lang: Lang,
  onAgain: () => void,
  onChange: () => void,
): void {
  const champion = match.champion
  const header = el('section', { class: 'flex flex-col items-center gap-2' })
  if (champion) {
    const label = el('p', { class: 'text-sm font-semibold tracking-wide text-gold uppercase' })
    label.textContent = t('favourite')
    const poster = el('img', {
      class: 'w-40 rounded-2xl shadow-xl shadow-black/50',
      src: posterUrl(champion),
      alt: title(champion, lang),
    })
    const name = el('h2', { class: 'text-center text-xl font-bold' })
    name.textContent = `${title(champion, lang)} · ${champion.year}`
    header.append(label, poster, name)
  }

  const listTitle = el('h3', { class: 'text-sm font-semibold text-white/60' })
  listTitle.textContent = t('yourPicks')

  // Latest pick first: the champion's last win sits at the top of the list.
  const picks = [...match.history].reverse()
  const list = el(
    'ol',
    { class: 'flex flex-col gap-2' },
    picks.map((choice, index) => {
      const thumb = el('img', {
        class: 'h-16 w-11 rounded-md object-cover',
        src: posterUrl(choice.winner),
        alt: '',
      })
      const name = el('p', { class: 'text-sm font-semibold' })
      name.textContent = `${title(choice.winner, lang)} · ${choice.winner.year}`
      const over = el('p', { class: 'text-xs text-white/45' })
      over.textContent = `${title(choice.loser, lang)}`
      const rank = el('span', { class: 'w-6 text-right text-xs text-white/40' })
      rank.textContent = String(picks.length - index)
      return el('li', { class: 'flex items-center gap-3 rounded-xl bg-night-soft/70 p-2' }, [
        rank,
        thumb,
        el('div', { class: 'flex flex-col' }, [name, over]),
      ])
    }),
  )

  const again = el('button', {
    type: 'button',
    class: 'rounded-full bg-gold px-8 py-4 text-lg font-bold text-night',
  })
  again.textContent = t('playAgain')
  again.addEventListener('click', onAgain)

  const change = el('button', {
    type: 'button',
    class: 'rounded-full bg-night-soft px-6 py-3 text-sm font-semibold text-white/70',
  })
  change.textContent = t('change')
  change.addEventListener('click', onChange)

  clear(root)
  root.append(
    el('main', { class: 'mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8' }, [
      header,
      el('section', { class: 'flex flex-col gap-2' }, [listTitle, list]),
      el('div', { class: 'flex flex-col items-center gap-3' }, [again, change]),
    ]),
  )
}
