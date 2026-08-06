<p align="center">
  <img src="public/icon.svg" alt="Kartela" width="140" />
</p>

<h1 align="center">Kartela</h1>

<p align="center">
  Two movie posters, one question: which one do you keep? 🎬
</p>

<p align="center">
  <a href="https://endika.github.io/kartela/"><b>▶&nbsp; Play Kartela</b></a>
</p>

---

## How to play

Two posters show up. Swipe towards the one you like more — it stays on screen and takes on
the next challenger. Keep going until the deck runs out, and the last poster standing is
your champion. At the end you get the full list of everything you picked along the way.

Swiping works with a finger, a mouse, or the ← / → keys, and a tap on a poster picks it too.

## Features

- **189 films** — 64 Disney classics, 31 Pixar, 51 DreamWorks and 43 Disney live-action.
- **Pick your studios** — each of the four is a toggle, and sequels have their own switch.
- **Pick your length** — a short 12-poster run, a 24 one, or the whole catalogue.
- **Fully offline & installable** — a PWA that keeps working with no connection after the
  first load, posters included.
- **6 languages** — English, Español, Euskara, Galego, Català, Valencià.
- **No accounts, no backend, no ads** — nothing leaves your device.

## Tech

Vanilla TypeScript + [Vite](https://vite.dev), Tailwind for the UI, Vitest for the tests.

```bash
npm install
npm run dev
```

The catalogue is generated once and committed, not fetched at runtime:

```bash
npm run fetch:catalog   # tools/catalog-seed.json -> src/data/catalog.json + public/posters
```

`tools/catalog-seed.json` is the curated part — which films, which category, which are
sequels, and any hand-written title. Everything else (localized titles, poster image) comes
from Wikipedia and is cached under `tools/.cache`, so a rerun makes no requests and produces
a byte-identical result.

## Credits

Movie posters are the property of their respective studios and are used here as
low-resolution thumbnails. See [NOTICE](NOTICE).
